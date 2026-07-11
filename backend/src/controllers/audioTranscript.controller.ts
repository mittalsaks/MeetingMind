// backend/src/controllers/audioTranscript.controller.ts
import { Response } from 'express'
import mongoose from 'mongoose'
import Meeting from '../models/Meeting'
import Task from '../models/Task'
import Attendance from '../models/Attendance'
import User from '../models/User'
import { AuthRequest } from '../middleware/auth'
import { getISTDayBounds } from '../utils/timezone'
import { extractCommitmentsFromAudio } from '../utils/geminiExtract'

// Fuzzy name match â€” exact first, then partial substring, auto-accept only if
// exactly one candidate. Same pattern as processTranscript in meeting.controller.ts.
function fuzzyMatchStudent(
  name: string,
  students: { _id: mongoose.Types.ObjectId; name: string }[]
): mongoose.Types.ObjectId | null {
  const lower = name.toLowerCase().trim()

  // 1. Exact match
  const exact = students.find((s) => s.name.toLowerCase() === lower)
  if (exact) return exact._id

  // 2. Partial substring match
  const partial = students.filter(
    (s) => s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase())
  )
  if (partial.length === 1) return partial[0]._id

  return null
}

// Reuse the same syncMeetingAttendanceCounts logic from attendance.controller.ts
// (copied here to avoid circular imports â€” keep in sync if attendance logic changes)
async function syncMeetingAttendanceCounts(meetingId: string, workspaceId: string) {
  const meetingObjId = new mongoose.Types.ObjectId(meetingId)
  const workspaceObjId = new mongoose.Types.ObjectId(workspaceId)

  const [attendanceCount, totalInvited] = await Promise.all([
    Attendance.countDocuments({
      meetingId: meetingObjId,
      workspaceId: workspaceObjId,
      status: 'present',
      verbalUpdateGiven: true,
    }),
    User.countDocuments({
      workspaceId: workspaceObjId,
      role: 'user',
      isActive: true,
      inviteAccepted: true,
    }),
  ])

  await Meeting.findByIdAndUpdate(meetingObjId, { attendanceCount, totalInvited })
}

/**
 * POST /api/meetings/:id/process-audio-chunk
 *
 * Body:
 *   audioBase64: string   â€” base64-encoded audio chunk
 *   mimeType: string      â€” e.g. "audio/webm" or "audio/wav"
 *
 * What it does:
 *   1. Sends audio chunk to Gemini â†’ extracts who spoke + commitments
 *   2. For each matched student who spoke:
 *      a. Creates/updates a Task (source: 'meeting', same as text pipeline)
 *      b. Upserts an Attendance record with verbalUpdateGiven: true, status: 'present'
 *   3. Syncs Meeting.attendanceCount / totalInvited
 *
 * Returns: { success, tasksCreated, attendanceMarked, spoke: [userIds] }
 */
export const processAudioChunk = async (req: AuthRequest, res: Response) => {
  try {
    const { id: meetingId } = req.params
    const { audioBase64, mimeType } = req.body

    if (!audioBase64 || !mimeType) {
      return res.status(400).json({ message: 'audioBase64 and mimeType are required' })
    }

    // Validate supported mimeTypes (Gemini supports these for audio)
    const supportedMimeTypes = ['audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/webm']
    if (!supportedMimeTypes.includes(mimeType)) {
      return res.status(400).json({ message: `Unsupported mimeType. Supported: ${supportedMimeTypes.join(', ')}` })
    }

    // 1. Fetch meeting (verify it belongs to this workspace)
    const meeting = await Meeting.findOne({
      _id: meetingId,
      workspaceId: req.user!.workspaceId,
    })
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' })
    }

    // 2. Get all students in this workspace for name matching
    const students = await User.find(
      { workspaceId: req.user!.workspaceId, role: 'user', isActive: true, inviteAccepted: true },
      { _id: 1, name: 1 }
    )
    const studentList = students.map((s) => ({ _id: s._id as mongoose.Types.ObjectId, name: s.name }))
    const knownNames = studentList.map((s) => s.name)

    // 3. Send to Gemini
    const commitments = await extractCommitmentsFromAudio(audioBase64, mimeType, knownNames)

    if (commitments.length === 0) {
      return res.json({ success: true, tasksCreated: 0, attendanceMarked: 0, spoke: [] })
    }

    // 4. Process each commitment
    const spokeUserIds: mongoose.Types.ObjectId[] = []
    let tasksCreated = 0
    let attendanceMarked = 0

    const deadline = new Date(meeting.scheduledDate)
    deadline.setDate(deadline.getDate() + 7)

    const { startOfDay: attendanceDate } = getISTDayBounds()

    for (const c of commitments) {
      const userId = fuzzyMatchStudent(c.studentName, studentList)
      if (!userId) {
        console.warn(`âš ï¸ Could not match student name: "${c.studentName}" â€” skipping`)
        continue
      }

      spokeUserIds.push(userId)

      // 4a. Create Task (same fields as text pipeline)
      if (c.nextCommitment) {
        await Task.create({
          workspaceId: req.user!.workspaceId,
          userId,
          meetingId: meeting._id,
          title: c.nextCommitment,
          description: c.completedWork
            ? `Completed: ${c.completedWork}`
            : undefined,
          status: 'pending',
          source: 'meeting',
          deadline,
        })
        tasksCreated++
      }

      // 4b. Mark Attendance â€” upsert, same pattern as markAttendance controller
      const dayStart = new Date(attendanceDate)
const dayEnd = new Date(dayStart)
dayEnd.setDate(dayEnd.getDate() + 1)

await Attendance.findOneAndUpdate(
  { workspaceId: req.user!.workspaceId, userId, date: { $gte: dayStart, $lt: dayEnd } },
  { date: attendanceDate, meetingId: meeting._id, status: 'present', verbalUpdateGiven: true, joinedMeeting: true, markedBy: 'extension' },
  { upsert: true, new: true }
)
      attendanceMarked++
    }

    // 5. Sync meeting counts
    if (spokeUserIds.length > 0) {
      await syncMeetingAttendanceCounts(meetingId as string, req.user!.workspaceId)
    }

    res.json({
      success: true,
      tasksCreated,
      attendanceMarked,
      spoke: spokeUserIds.map((id) => id.toString()),
    })
  } catch (error: any) {
    console.error('ðŸ”´ processAudioChunk error:', error)
    res.status(500).json({ message: error.message })
  }
}
/**
 * POST /api/meetings/:id/process-transcript-chunk
 * Body: { transcript: string }
 * Same logic as processAudioChunk but accepts text directly from Speech Recognition
 */
export const processTranscriptChunk = async (req: AuthRequest, res: Response) => {
  try {
    const { id: meetingId } = req.params
    const { transcript } = req.body

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ message: 'transcript is required' })
    }

    const meeting = await Meeting.findOne({
      _id: meetingId,
      workspaceId: req.user!.workspaceId,
    })
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' })

    const students = await User.find(
      { workspaceId: req.user!.workspaceId, role: 'user', isActive: true, inviteAccepted: true },
      { _id: 1, name: 1 }
    )
    const studentList = students.map((s) => ({ _id: s._id as mongoose.Types.ObjectId, name: s.name }))
    const knownNames = studentList.map((s) => s.name)

    const { extractCommitmentsFromTranscript } = await import('../utils/geminiExtract')
    const commitments = await extractCommitmentsFromTranscript(transcript, knownNames)
    // ADD KARO YEH LINES:
    console.log('ðŸ“‹ Known students:', knownNames)
    console.log('ðŸ“ Transcript received:', transcript)
    console.log('ðŸ¤– Gemini commitments:', JSON.stringify(commitments))
    if (commitments.length === 0) {
      return res.json({ success: true, tasksCreated: 0, attendanceMarked: 0, spoke: [] })
    }

    const spokeUserIds: mongoose.Types.ObjectId[] = []
    let tasksCreated = 0
    let attendanceMarked = 0

    const deadline = new Date(meeting.scheduledDate)
    deadline.setDate(deadline.getDate() + 7)

    const { startOfDay: attendanceDate } = getISTDayBounds()

    for (const c of commitments) {
      const userId = fuzzyMatchStudent(c.studentName, studentList)
      if (!userId) {
        console.warn(`âš ï¸ Could not match student: "${c.studentName}"`)
        continue
      }
      spokeUserIds.push(userId)

      if (c.nextCommitment) {
        await Task.create({
          workspaceId: req.user!.workspaceId,
          userId,
          meetingId: meeting._id,
          title: c.nextCommitment,
          description: c.completedWork ? `Completed: ${c.completedWork}` : undefined,
          status: 'pending',
          source: 'meeting',
          deadline,
        })
        tasksCreated++
      }

      const dayStart = new Date(attendanceDate)
const dayEnd = new Date(dayStart)
dayEnd.setDate(dayEnd.getDate() + 1)

await Attendance.findOneAndUpdate(
  { workspaceId: req.user!.workspaceId, userId, date: { $gte: dayStart, $lt: dayEnd } },
  { date: attendanceDate, meetingId: meeting._id, status: 'present', verbalUpdateGiven: true, joinedMeeting: true, markedBy: 'extension' },
  { upsert: true, new: true }
)
      attendanceMarked++
    }

    if (spokeUserIds.length > 0) {
      await syncMeetingAttendanceCounts(meetingId as string, req.user!.workspaceId)
    }

    res.json({ success: true, tasksCreated, attendanceMarked, spoke: spokeUserIds.map((id) => id.toString()) })
  } catch (error: any) {
    console.error('ðŸ”´ processTranscriptChunk error:', error)
    res.status(500).json({ message: error.message })
  }
}
