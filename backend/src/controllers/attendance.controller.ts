import { Response } from 'express'
import Attendance from '../models/Attendance'
import Meeting from '../models/Meeting'
import User from '../models/User'
import { AuthRequest } from '../middleware/auth'
import { getISTDayBounds } from '../utils/timezone'
import mongoose from 'mongoose'

function toObjectId(value: string | mongoose.Types.ObjectId) {
  return value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(value)
}

function normalizeDay(dateInput: Date | string) {
  const { startOfDay } = getISTDayBounds(new Date(dateInput))
  return startOfDay
}

function getDayRange(dateInput: Date | string) {
  const start = normalizeDay(dateInput)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

// Recomputes attendanceCount + totalInvited on the Meeting doc, so these
// fields are never just stale/zero like they were before.
// - attendanceCount = students who were present AND gave a verbal update
//   (matches the app's "spoke" definition used elsewhere in the UI)
// - totalInvited = workspace's active, invite-accepted students at the time
//   of the count (i.e. who *could* have attended), not just how many
//   attendance records happen to exist â€” this is the more correct,
//   industry-standard meaning of "invited"
async function syncMeetingAttendanceCounts(meetingId: string, workspaceId: string) {
  const meetingObjId = new mongoose.Types.ObjectId(meetingId)
  const workspaceObjId = new mongoose.Types.ObjectId(workspaceId)

  const [presentRecords, totalInvited] = await Promise.all([
    Attendance.countDocuments({ meetingId: meetingObjId, workspaceId: workspaceObjId, status: 'present', verbalUpdateGiven: true }),
    User.countDocuments({ workspaceId: workspaceObjId, role: 'user', isActive: true, inviteAccepted: true }),
  ])

  await Meeting.findByIdAndUpdate(meetingObjId, { attendanceCount: presentRecords, totalInvited })
}

export async function syncDailyUpdateAttendance(workspaceId: string | mongoose.Types.ObjectId, userId: string | mongoose.Types.ObjectId, dateInput: Date | string) {
  const workspaceObjectId = toObjectId(workspaceId)
  const userObjectId = toObjectId(userId)
  const { start, end } = getDayRange(dateInput)

  const existing = await Attendance.findOne({
    workspaceId: workspaceObjectId,
    userId: userObjectId,
    date: { $gte: start, $lt: end },
  })

  if (existing?.status === 'leave_approved') {
    return existing
  }

  const verbalUpdateGiven = existing?.status === 'present' && Boolean(existing.verbalUpdateGiven)
  const joinedMeeting = existing?.status === 'present' ? Boolean(existing.joinedMeeting) : false

  return Attendance.findOneAndUpdate(
    { workspaceId: workspaceObjectId, userId: userObjectId, date: { $gte: start, $lt: end } },
    {
      $set: {
        date: start,
        status: 'present',
        verbalUpdateGiven,
        joinedMeeting,
        markedBy: 'admin',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
}

export async function syncLeaveAttendance(workspaceId: string | mongoose.Types.ObjectId, userId: string | mongoose.Types.ObjectId, fromDate: Date | string, toDate: Date | string, status: 'approved' | 'rejected') {
  const workspaceObjectId = toObjectId(workspaceId)
  const userObjectId = toObjectId(userId)
  const start = normalizeDay(fromDate)
  const end = normalizeDay(toDate)
  const dayCursor = new Date(start)

  if (status === 'rejected') {
    return Attendance.deleteMany({
      workspaceId: workspaceObjectId,
      userId: userObjectId,
      date: { $gte: start, $lte: end },
      status: 'leave_approved',
    })
  }

  const operations = [] as Promise<any>[]
  while (dayCursor <= end) {
    const date = new Date(dayCursor)
    operations.push(
      Attendance.findOneAndUpdate(
        { workspaceId: workspaceObjectId, userId: userObjectId, date: { $gte: normalizeDay(date), $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) } },
        {
          $set: {
            date,
            status: 'leave_approved',
            verbalUpdateGiven: false,
            joinedMeeting: false,
            markedBy: 'admin',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
    dayCursor.setDate(dayCursor.getDate() + 1)
  }

  return Promise.all(operations)
}

// @POST /api/attendance/mark (extension/admin marks attendance based on verbal update)
export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, meetingId, verbalUpdateGiven, joinedMeeting } = req.body
    const date = normalizeDay(new Date())
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
    // real attendance records â€” these fields were previously never updated.
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
    // always created with role:'user' â€” there is no separate 'student'
    // role in the backend, despite the frontend's User type allowing it.)
    if (req.user!.role !== 'admin') {
      filter.userId = req.user!.userId
    }
    const records = await Attendance.find(filter)
  .populate('userId', 'name email')
  .populate('meetingId', 'scheduledDate scheduledTime')
  .sort({ date: -1 })

// Frontend heatmap compares record.userId as a plain string ID against
// student._id. Since populate() replaces userId with the full user object,
// we flatten it back to a string ID here (keeping populated name/email
// available separately if ever needed) so the string comparison works.
const flattened = records.map((r: any) => ({
  ...r.toObject(),
  userId: r.userId?._id?.toString() || r.userId,
}))

res.json({ success: true, records: flattened })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
