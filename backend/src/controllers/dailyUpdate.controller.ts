import { Response } from 'express'
import DailyUpdate from '../models/DailyUpdate'
import User from '../models/User'
import { AuthRequest } from '../middleware/auth'
import { sendEmail } from '../utils/sendEmail'
import { syncDailyUpdateAttendance } from './attendance.controller'

// @POST /api/daily-updates (user submits own update)
export const submitUpdate = async (req: AuthRequest, res: Response) => {
  try {
    const { yesterday, today, blockers } = req.body
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)

    const existing = await DailyUpdate.findOne({
      userId: req.user!.userId,
      workspaceId: req.user!.workspaceId,
      date: todayDate
    })

    if (existing) {
      existing.yesterday = yesterday
      existing.today = today
      existing.blockers = blockers
      await existing.save()
      await syncDailyUpdateAttendance(req.user!.workspaceId, req.user!.userId, todayDate)
      return res.json({ success: true, update: existing, message: 'Update edited' })
    }

    const update = await DailyUpdate.create({
      workspaceId: req.user!.workspaceId,
      userId: req.user!.userId,
      date: todayDate,
      yesterday,
      today,
      blockers
    })

    await syncDailyUpdateAttendance(req.user!.workspaceId, req.user!.userId, todayDate)

    // Admin ko email bhejo
    const [admin, student] = await Promise.all([
      User.findOne({ workspaceId: req.user!.workspaceId, role: 'admin' }),
      User.findById(req.user!.userId, 'name')
    ])

    if (admin && student) {
      await sendEmail({
        to: admin.email,
        subject: `Daily Update: ${student.name}`,
        html: `
          <h3>${student.name} ne aaj ka daily update submit kiya</h3>
          <p><strong>Yesterday:</strong> ${yesterday}</p>
          <p><strong>Today:</strong> ${today}</p>
          ${blockers ? `<p><strong>Blockers:</strong> ${blockers}</p>` : ''}
        `
      })
    }

    res.status(201).json({ success: true, update })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/daily-updates (admin = all, user = own only)
export const getUpdates = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { workspaceId: req.user!.workspaceId }
    if (req.user!.role === 'user') {
      filter.userId = req.user!.userId
    }

    const updates = await DailyUpdate.find(filter)
      .populate('userId', 'name email')
      .sort({ date: -1 })

    res.json({ success: true, updates })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}