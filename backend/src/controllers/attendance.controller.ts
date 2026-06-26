import { Response } from 'express'
import Attendance from '../models/Attendance'
import Meeting from '../models/Meeting'
import User from '../models/User'
import { AuthRequest } from '../middleware/auth'
import mongoose from 'mongoose' 
// Recomputes attendanceCount + totalInvited on the Meeting doc, so these
// fields are never just stale/zero like they were before.
// - attendanceCount = students who were present AND gave a verbal update
//   (matches the app's "spoke" definition used elsewhere in the UI)
// - totalInvited = workspace's active, invite-accepted students at the time
//   of the count (i.e. who *could* have attended), not just how many
//   attendance records happen to exist — this is the more correct,
//   industry-standard meaning of "invited"
async function syncMeetingAttendanceCounts(meetingId: string, workspaceId: string) {
  console.log('🔵 syncMeeting called:', meetingId, workspaceId)
  const meetingObjId = new mongoose.Types.ObjectId(meetingId)
  const workspaceObjId = new mongoose.Types.ObjectId(workspaceId)
  
  const [presentRecords, totalInvited] = await Promise.all([
    Attendance.countDocuments({ meetingId: meetingObjId, workspaceId: workspaceObjId, status: 'present', verbalUpdateGiven: true }),
    User.countDocuments({ workspaceId: workspaceObjId, role: 'user', isActive: true, inviteAccepted: true }),
  ])
  console.log('🟢 counts:', presentRecords, totalInvited)
  await Meeting.findByIdAndUpdate(meetingObjId, { attendanceCount: presentRecords, totalInvited })
  console.log('✅ Meeting updated')
}
// @POST /api/attendance/mark (extension/admin marks attendance based on verbal update)
export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, meetingId, verbalUpdateGiven, joinedMeeting } = req.body
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    const attendance = await Attendance.findOneAndUpdate(
      { workspaceId: req.user!.workspaceId, userId, meetingId },
      {
        date,
        status: verbalUpdateGiven ? 'present' : 'absent',
        verbalUpdateGiven,
        joinedMeeting,
        markedBy: req.user!.role === 'admin' ? 'admin' : 'extension'
      },
      { upsert: true, new: true }
    )

    // Keep the Meeting doc's attendanceCount/totalInvited in sync with
    // real attendance records — these fields were previously never updated.
    await syncMeetingAttendanceCounts(meetingId, req.user!.workspaceId)

    res.json({ success: true, attendance })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/attendance (admin = all, student = own only)
export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { workspaceId: req.user!.workspaceId }
    // role !== 'admin' covers the only other real role, 'user' (students).
    // (Confirmed via workspace.controller.ts: invite-accepted students are
    // always created with role:'user' — there is no separate 'student'
    // role in the backend, despite the frontend's User type allowing it.)
    if (req.user!.role !== 'admin') {
      filter.userId = req.user!.userId
    }
    const records = await Attendance.find(filter)
      .populate('userId', 'name email')
      .populate('meetingId', 'scheduledDate scheduledTime')
      .sort({ date: -1 })
    res.json({ success: true, records })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}