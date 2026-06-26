import { Response } from 'express'
import Meeting from '../models/Meeting'
import User from '../models/User'
import Task from '../models/Task'
import { AuthRequest } from '../middleware/auth'
import { sendEmail } from '../utils/sendEmail'
import { extractCommitmentsFromTranscript } from '../utils/geminiExtract'

// @POST /api/meetings (admin only - schedule new meeting)
export const createMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const { scheduledDate, scheduledTime, googleMeetLink } = req.body

    const totalUsers = await User.countDocuments({
      workspaceId: req.user!.workspaceId,
      role: 'user',
      isActive: true
    })

    const meeting = await Meeting.create({
      workspaceId: req.user!.workspaceId,
      scheduledDate,
      scheduledTime,
      googleMeetLink,
      status: 'scheduled',
      totalInvited: totalUsers
    })

    res.status(201).json({ success: true, meeting })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/meetings (all workspace meetings)
export const getMeetings = async (req: AuthRequest, res: Response) => {
  try {
    const meetings = await Meeting.find({ workspaceId: req.user!.workspaceId })
      .sort({ scheduledDate: -1 })

    res.json({ success: true, meetings })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/meetings/:id/confirm (admin only)
export const confirmMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      workspaceId: req.user!.workspaceId
    })

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' })

    meeting.status = 'confirmed'
    meeting.adminConfirmedAt = new Date()
    await meeting.save()

    // Send reminder emails to all workspace users
    const users = await User.find({
      workspaceId: req.user!.workspaceId,
      role: 'user',
      isActive: true,
      inviteAccepted: true
    })

    for (const user of users) {
  const meetLinkHtml = meeting.googleMeetLink
    ? `<p>Join here: <a href="${meeting.googleMeetLink}">${meeting.googleMeetLink}</a></p>`
    : `<p style="color:#b45309;">⚠️ Meeting link not added yet — please check with your mentor before the call.</p>`

  await sendEmail({
    to: user.email,
    subject: 'MeetingMind - Upcoming Meeting Reminder',
    html: `<p>Hi ${user.name},</p><p>Reminder: Your weekly meeting is scheduled for <strong>${meeting.scheduledDate.toDateString()} at ${meeting.scheduledTime}</strong>.</p>${meetLinkHtml}`
  })
}

    meeting.reminderSent = true
    await meeting.save()

    res.json({ success: true, meeting, message: `Reminders sent to ${users.length} students` })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/meetings/:id/reschedule (admin only)
export const rescheduleMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const { newDate, newTime } = req.body

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      workspaceId: req.user!.workspaceId
    })

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' })

    meeting.scheduledDate = newDate
    meeting.scheduledTime = newTime
    meeting.status = 'rescheduled'
    await meeting.save()

    res.json({ success: true, meeting })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/meetings/:id/process-transcript (admin only)
// Temporary substitute for the Chrome Extension: admin pastes the raw
// meeting transcript, Gemini extracts each student's completed work +
// next commitment, and a Task is auto-created per commitment. Once the
// extension exists it will call this same endpoint with the live transcript.
export const processTranscript = async (req: AuthRequest, res: Response) => {
  try {
    const { transcript } = req.body
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ message: 'Transcript is required' })
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      workspaceId: req.user!.workspaceId
    })
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' })

    const students = await User.find({
      workspaceId: req.user!.workspaceId,
      role: 'user',
      isActive: true
    }).select('name')

    if (students.length === 0) {
      return res.status(400).json({ message: 'No active students in this workspace' })
    }

    const studentNames = students.map((s) => s.name)
    const extracted = await extractCommitmentsFromTranscript(transcript, studentNames)

    if (extracted.length === 0) {
      return res.json({
        success: true,
        message: 'No student updates detected in transcript',
        tasksCreated: 0,
        spoke: []
      })
    }

    // Next commitment is due by the following week's meeting
    const deadline = new Date(meeting.scheduledDate)
    deadline.setDate(deadline.getDate() + 7)

    const createdTasks = []
    const spokeUserIds: string[] = []

    for (const item of extracted) {
      const geminiName = item.studentName.trim().toLowerCase()

      // 1. Try exact match first (most reliable)
      let matchedStudent = students.find(
        (s) => s.name.trim().toLowerCase() === geminiName
      )

      // 2. Fallback: partial match — handles Gemini truncating/expanding names
      //    e.g. DB has "Sakshi Mittal lovebabbar", Gemini returns "Sakshi Mittal"
      if (!matchedStudent) {
        const candidates = students.filter((s) => {
          const dbName = s.name.trim().toLowerCase()
          return dbName.includes(geminiName) || geminiName.includes(dbName)
        })

        // Only auto-accept if exactly one candidate matches — avoid wrongly
        // picking between two similarly-named students (e.g. two "Sakshi"s)
        if (candidates.length === 1) {
          matchedStudent = candidates[0]
          console.log(`ℹ️ Partial-matched "${item.studentName}" → "${matchedStudent.name}"`)
        }
      }

      if (!matchedStudent) {
        console.log(`⚠️ Could not match "${item.studentName}" to a known student — skipping`)
        continue
      }

      spokeUserIds.push(matchedStudent._id.toString())

      if (item.nextCommitment && item.nextCommitment.trim()) {
        const task = await Task.create({
          workspaceId: req.user!.workspaceId,
          userId: matchedStudent._id,
          title: item.nextCommitment.trim(),
          description: item.completedWork ? `Last update: ${item.completedWork.trim()}` : undefined,
          source: 'meeting',
          deadline,
          status: 'pending',
          meetingId: meeting._id,
          priority: 'Medium'
        })
        createdTasks.push(task)
      }
    }

    meeting.attendanceCount = spokeUserIds.length
    meeting.summary = `${extracted.length} student update(s) processed via AI`
    await meeting.save()

    res.json({
      success: true,
      message: `${createdTasks.length} task(s) created from ${extracted.length} student update(s)`,
      tasksCreated: createdTasks.length,
      spoke: spokeUserIds
    })
  } catch (error: any) {
    console.error('🔴 processTranscript error:', error.message)
    res.status(500).json({ message: error.message })
  }
}
// Add this function to meeting.controller.ts (anywhere alongside the other exports).
// Also add to meeting.routes.ts: router.get('/today-active', getTodayActiveMeeting)
// IMPORTANT: register this route BEFORE any '/:id' routes in meeting.routes.ts,
// otherwise Express will try to match "today-active" as an :id param and break this.

// @GET /api/meetings/today-active (admin only)
// Used by the Chrome Extension to auto-detect which meeting a live transcript
// belongs to, without the admin having to manually pick one. Returns today's
// meeting if it's scheduled or confirmed; otherwise returns meeting: null so
// the extension can fall back to a manual picker.
export const getTodayActiveMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.user!.workspaceId

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    const meeting = await Meeting.findOne({
      workspaceId,
      scheduledDate: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['scheduled', 'confirmed', 'rescheduled'] }
    }).sort({ scheduledDate: 1 })

    res.json({
      success: true,
      meeting: meeting || null
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}