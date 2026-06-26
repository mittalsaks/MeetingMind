import { Response } from 'express'
import LeaveRequest from '../models/LeaveRequest'
import { AuthRequest } from '../middleware/auth'
import { sendEmail } from '../utils/sendEmail'
import User from '../models/User'

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

    const student = leave.userId as any
    await sendEmail({
      to: student.email,
      subject: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      html: `<p>Hi ${student.name},</p><p>Your leave request has been <strong>${status}</strong>.</p>${adminNote ? `<p>Note: ${adminNote}</p>` : ''}`
    })

    res.json({ success: true, leave })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}