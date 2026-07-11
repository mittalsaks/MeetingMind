import { Response } from 'express'
import LeaveRequest from '../models/LeaveRequest'
import User from '../models/User'
import { AuthRequest } from '../middleware/auth'
import { sendEmail } from '../utils/sendEmail'
import { syncLeaveAttendance } from './attendance.controller'
import { createNotification } from './notification.controller'
// @POST /api/leave-requests (user submits)
export const submitLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { reason, fromDate, toDate, weekProgress, nextPlan } = req.body

    const leave = await LeaveRequest.create({
      workspaceId: req.user!.workspaceId,
      userId: req.user!.userId,
      reason,
      fromDate,
      toDate,
      weekProgress,
      nextPlan
    })

    // Notify all admins in this workspace that a new leave request needs review
    const admins = await User.find({ workspaceId: req.user!.workspaceId, role: 'admin' })
    const student = await User.findById(req.user!.userId)

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `🌴 New leave request from ${student?.name || 'a student'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #111;">New Leave Request</h2>
            <p>Hi ${admin.name},</p>
            <p><strong>${student?.name || 'A student'}</strong> has requested leave from
              <strong>${new Date(fromDate).toDateString()}</strong> to
              <strong>${new Date(toDate).toDateString()}</strong>.</p>
            <p><em>Reason:</em> ${reason}</p>
            <p>Please review it in the dashboard.</p>
            <p style="margin-top:24px;color:#888;font-size:12px;">MeetingMind</p>
          </div>
        `,
      })
      await createNotification({
  workspaceId: req.user!.workspaceId,
  userId: admin._id,
  type: 'leave_request',
  title: 'New leave request',
  message: `${student?.name || 'A student'} requested leave from ${new Date(fromDate).toDateString()} to ${new Date(toDate).toDateString()}`,
  link: '/leave-requests',
})
    }

    res.status(201).json({ success: true, leave })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/leave-requests (admin = all, user = own)
export const getLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { workspaceId: req.user!.workspaceId }
    if (req.user!.role === 'user') {
      filter.userId = req.user!.userId
    }

    const leaves = await LeaveRequest.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })

    res.json({ success: true, leaves })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/leave-requests/:id (admin approve/reject)
export const reviewLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { status, adminNote } = req.body

    const leave = await LeaveRequest.findOne({
      _id: req.params.id,
      workspaceId: req.user!.workspaceId
    }).populate('userId', 'name email')

    if (!leave) return res.status(404).json({ message: 'Leave request not found' })

    leave.status = status
    leave.adminNote = adminNote
    leave.reviewedBy = req.user!.userId as any
    leave.reviewedAt = new Date()
    await leave.save()

    await syncLeaveAttendance(req.user!.workspaceId, leave.userId, leave.fromDate, leave.toDate, status)

    const student = leave.userId as any
    await sendEmail({
      to: student.email,
      subject: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      html: `<p>Hi ${student.name},</p><p>Your leave request has been <strong>${status}</strong>.</p>${adminNote ? `<p>Note: ${adminNote}</p>` : ''}`
    })
    await createNotification({
  workspaceId: req.user!.workspaceId,
  userId: student._id,
  type: 'leave_reviewed',
  title: `Leave request ${status}`,
  message: adminNote ? `Note: ${adminNote}` : `Your leave request has been ${status}.`,
  link: '/leave-requests',
})
    res.json({ success: true, leave })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}