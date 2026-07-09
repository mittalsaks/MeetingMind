import { Response } from 'express'
import Task from '../models/Task'
import User from '../models/User'
import { AuthRequest } from '../middleware/auth'
import { sendEmail } from '../utils/sendEmail'

// @GET /api/tasks (admin = all workspace tasks, user = own tasks only)
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { workspaceId: req.user!.workspaceId }
    if (req.user!.role === 'user') {
      filter.userId = req.user!.userId
    }

    const tasks = await Task.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })

    res.json({ success: true, tasks })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/tasks (admin only - manual task creation)
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, title, description, deadline, priority } = req.body

    const task = await Task.create({
      workspaceId: req.user!.workspaceId,
      userId,
      title,
      description,
      deadline,
      priority: priority || 'Medium',
      source: 'manual'
    })

    res.status(201).json({ success: true, task })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/tasks/:id/complete (user marks own task as done)
export const markComplete = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      workspaceId: req.user!.workspaceId,
      userId: req.user!.userId
    })

    if (!task) return res.status(404).json({ message: 'Task not found' })
    if (task.status !== 'pending') return res.status(400).json({ message: 'Task already submitted' })

    task.status = 'waiting_verification'
    task.submittedAt = new Date()
    await task.save()

    // Notify all admins in this workspace that a task is waiting verification
    const admins = await User.find({ workspaceId: req.user!.workspaceId, role: 'admin' })
    const studentName = (await User.findById(req.user!.userId))?.name || 'A student'

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `✅ ${studentName} marked a task complete — review needed`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #111;">Task Ready for Verification</h2>
            <p>Hi ${admin.name},</p>
            <p><strong>${studentName}</strong> has marked the following task as complete:</p>
            <p style="padding:12px;background:#f3f4f6;border-radius:8px;">${task.title}</p>
            <p>Please review and verify it in the dashboard.</p>
            <p style="margin-top:24px;color:#888;font-size:12px;">MeetingMind</p>
          </div>
        `,
      })
    }

    res.json({ success: true, task })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/tasks/:id/verify (admin only)
export const verifyTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      workspaceId: req.user!.workspaceId
    })

    if (!task) return res.status(404).json({ message: 'Task not found' })

    task.status = 'verified'
    task.verifiedAt = new Date()
    task.verifiedBy = req.user!.userId as any
    await task.save()

    const student = await User.findById(task.userId)
    if (student) {
      await sendEmail({
        to: student.email,
        subject: '🎉 Your task has been verified!',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #111;">Task Verified</h2>
            <p>Hi ${student.name},</p>
            <p>Your mentor has verified this task:</p>
            <p style="padding:12px;background:#f3f4f6;border-radius:8px;">${task.title}</p>
            <p>Great work — keep it up!</p>
            <p style="margin-top:24px;color:#888;font-size:12px;">MeetingMind</p>
          </div>
        `,
      })
    }

    res.json({ success: true, task })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/tasks/:id/reject (admin only)
export const rejectTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      workspaceId: req.user!.workspaceId
    })

    if (!task) return res.status(404).json({ message: 'Task not found' })

    task.status = 'rejected'
    await task.save()

    res.json({ success: true, task })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}