import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { getISTDayBounds } from '../utils/timezone'
import User from '../models/User'
import Task from '../models/Task'
import DailyUpdate from '../models/DailyUpdate'
import LeaveRequest from '../models/LeaveRequest'
import Meeting from '../models/Meeting'
import { sendEmail } from '../utils/sendEmail'
export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.user!.workspaceId

    const { startOfDay: today, endOfDay: tomorrow } = getISTDayBounds()

    // Week start (Monday)
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() + 1)

    const [
      totalStudents,
      updatedToday,
      pendingTasks,
      overdueTasks,
      pendingLeave,
      weeklyUpdates,
    ] = await Promise.all([
      User.countDocuments({ workspaceId, role: 'user', isActive: true }),
      DailyUpdate.distinct('submittedBy', {
        workspaceId,
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      Task.countDocuments({ workspaceId, status: { $in: ['pending', 'waiting_verification'] } }),
      Task.countDocuments({
        workspaceId,
        status: 'pending',
        deadline: { $lt: today }
      }),
      LeaveRequest.countDocuments({ workspaceId, status: 'pending' }),
      DailyUpdate.countDocuments({
        workspaceId,
        createdAt: { $gte: weekStart }
      }),
    ])

    const missingToday = totalStudents - updatedToday.length

    // Upcoming meeting
    const upcomingMeeting = await Meeting.findOne({
      workspaceId,
      scheduledDate: { $gte: today },
      status: { $in: ['scheduled', 'confirmed'] }
    }).sort({ scheduledDate: 1 })

    // Combine date + time into one real ISO datetime so the frontend can
    // format weekday/hour/minute correctly (scheduledDate alone has no
    // time-of-day â€” it's stored separately in scheduledTime). Previously
    // this sent a pre-formatted string, but admin-dashboard.tsx expects
    // an { title?, date? } object and was silently reading undefined
    // fields off the string, always falling back to "None".
    let upcomingMeetingPayload: { title?: string; date?: string } | null = null
    if (upcomingMeeting) {
      const combined = new Date(
        `${new Date(upcomingMeeting.scheduledDate).toISOString().slice(0, 10)}T${upcomingMeeting.scheduledTime}`
      )
      upcomingMeetingPayload = {
        title: upcomingMeeting.status === 'confirmed' ? 'Confirmed' : 'Awaiting confirmation',
        date: combined.toISOString(),
      }
    }

    res.json({
      success: true,
      stats: {
        updatedToday: updatedToday.length,
        totalStudents,
        missingToday,
        pendingTasks,
        overdueTasks,
        pendingLeave,
        weeklyUpdates,
        upcomingMeeting: upcomingMeetingPayload
      }
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
export const sendReminderEmail = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ 
      _id: req.params.userId, 
      workspaceId: req.user!.workspaceId,
      isActive: true 
    })
    if (!user) return res.status(404).json({ message: 'Student not found' })

    await sendEmail({
      to: user.email,
      subject: 'â° Reminder: Submit your daily update',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #111;">Daily Update Reminder</h2>
          <p>Hi ${user.name},</p>
          <p>Your mentor is waiting for your daily update. Please submit it now!</p>
          <a href="${process.env.FRONTEND_URL}/daily-updates" 
             style="display:inline-block;margin-top:16px;padding:10px 20px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;">
            Submit Update
          </a>
          <p style="margin-top:24px;color:#888;font-size:12px;">MeetingMind</p>
        </div>
      `,
    })

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
// Add this import at the top of admin.controller.ts (if not already present):
// import mongoose from 'mongoose'

// @GET /api/admin/missed-commitments (admin only)
// Returns overdue meeting-sourced commitments grouped by student, so the
// dashboard can surface insights like "Rahul missed 3 commitments in a row".
export const getMissedCommitments = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.user!.workspaceId
    const { startOfDay: today } = getISTDayBounds()

    const overdueTasks = await Task.find({
      workspaceId,
      source: 'meeting',
      status: 'pending',
      deadline: { $lt: today }
    })
      .populate('userId', 'name email')
      .sort({ deadline: 1 }) // oldest missed first
      .lean()

    if (overdueTasks.length === 0) {
      return res.json({ success: true, totalMissed: 0, students: [] })
    }

    // Group by student
    const grouped = new Map<string, {
      userId: string
      name: string
      email: string
      missedCount: number
      tasks: { taskId: string; title: string; deadline: Date }[]
    }>()

    for (const task of overdueTasks) {
      const user = task.userId as any
      if (!user || !user._id) continue // skip if user was deleted/deactivated

      const key = user._id.toString()
      if (!grouped.has(key)) {
        grouped.set(key, {
          userId: key,
          name: user.name,
          email: user.email,
          missedCount: 0,
          tasks: []
        })
      }

      const entry = grouped.get(key)!
      entry.missedCount += 1
      entry.tasks.push({
        taskId: task._id.toString(),
        title: task.title,
        deadline: task.deadline as Date
      })
    }

    // Sort students by most missed commitments first (highest risk)
    const students = Array.from(grouped.values()).sort((a, b) => b.missedCount - a.missedCount)

    res.json({
      success: true,
      totalMissed: overdueTasks.length,
      students
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
