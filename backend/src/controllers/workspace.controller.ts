import { Response } from 'express'
import crypto from 'crypto'
import User from '../models/User'
import Workspace from '../models/Workspace'
import { AuthRequest } from '../middleware/auth'
import { sendEmail } from '../utils/sendEmail'

// @POST /api/workspace/invite (admin only)
export const inviteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { email, name } = req.body
    const workspaceId = req.user!.workspaceId

    const existingUser = await User.findOne({ email, workspaceId })
    if (existingUser) return res.status(400).json({ message: 'User already invited to this workspace' })

    const workspace = await Workspace.findById(workspaceId)
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' })

    const inviteToken = crypto.randomBytes(32).toString('hex')

    const user = await User.create({
      name,
      email,
      role: 'user',
      workspaceId,
      inviteToken,
      inviteAccepted: false,
      isActive: true
    })

    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite/${inviteToken}`

    // Don't block the response on email sending — send it in the background
    sendEmail({
      to: email,
      subject: `You're invited to join ${workspace.name} on MeetingMind`,
      html: `
        <p>Hi ${name},</p>
        <p>You've been invited to join <strong>${workspace.name}</strong> on MeetingMind.</p>
        <p><a href="${inviteLink}">Click here to accept the invite and set your password</a></p>
        <p>This link is valid for 7 days.</p>
      `
    }).catch(err => console.error('Invite email failed:', err))

    res.status(201).json({
      success: true,
      message: 'Invitation sent',
      user: { id: user._id, name: user.name, email: user.email }
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/workspace/accept-invite/:token (public)
export const acceptInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params
    const { password } = req.body

    const user = await User.findOne({ inviteToken: token, inviteAccepted: false })
    if (!user) return res.status(400).json({ message: 'Invalid or expired invite link' })

    user.password = password
    user.inviteAccepted = true
    user.isEmailVerified = true
    user.inviteToken = undefined
    await user.save()

    res.json({ success: true, message: 'Account activated. You can now login.' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/workspace/students (admin only)
export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const students = await User.find({
      workspaceId: req.user!.workspaceId,
      role: 'user'
    }).select('name email isActive inviteAccepted createdAt')

    res.json({ success: true, students })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @DELETE /api/workspace/students/:id (admin only - soft delete)
export const deactivateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, workspaceId: req.user!.workspaceId, role: 'user' },
      { isActive: false },
      { new: true }
    )

    if (!user) return res.status(404).json({ message: 'Student not found' })

    res.json({ success: true, message: 'Student deactivated' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
// @GET /api/workspace (admin only) — fetch current workspace settings
export const getWorkspace = async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await Workspace.findById(req.user!.workspaceId)
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' })

    res.json({ success: true, workspace })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/workspace (admin only) — update workspace settings
export const updateWorkspace = async (req: AuthRequest, res: Response) => {
  try {
    const { name, url, timezone, weekStart } = req.body

    if (!name || !timezone || !weekStart) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const workspace = await Workspace.findByIdAndUpdate(
      req.user!.workspaceId,
      { name, url, timezone, weekStart },
      { new: true }
    )

    if (!workspace) return res.status(404).json({ message: 'Workspace not found' })

    res.json({ success: true, message: 'Workspace updated', workspace })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}