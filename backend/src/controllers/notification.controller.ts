import { Response } from 'express'
import Notification from '../models/Notification'
import { AuthRequest } from '../middleware/auth'

// Helper — call this from OTHER controllers (leave, task, meeting) whenever
// something happens that the other side should be told about.
// This is NOT an HTTP route itself.
export async function createNotification({
  workspaceId,
  userId,
  type,
  title,
  message,
  link,
}: {
  workspaceId: any
  userId: any
  type: string
  title: string
  message: string
  link?: string
}) {
  try {
    await Notification.create({ workspaceId, userId, type, title, message, link })
  } catch (err) {
    console.error('Failed to create notification:', err)
  }
}

// @GET /api/notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({
      workspaceId: req.user!.workspaceId,
      userId: req.user!.userId,
    }).sort({ createdAt: -1 }).limit(30)

    const unreadCount = await Notification.countDocuments({
      workspaceId: req.user!.workspaceId,
      userId: req.user!.userId,
      read: false,
    })

    res.json({ success: true, notifications, unreadCount })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/notifications/read-all
export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { workspaceId: req.user!.workspaceId, userId: req.user!.userId, read: false },
      { read: true }
    )
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/notifications/:id/read
export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, workspaceId: req.user!.workspaceId, userId: req.user!.userId },
      { read: true }
    )
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}