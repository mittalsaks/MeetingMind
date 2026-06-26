import { Response } from 'express'
import Task from '../models/Task'
import { AuthRequest } from '../middleware/auth'

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