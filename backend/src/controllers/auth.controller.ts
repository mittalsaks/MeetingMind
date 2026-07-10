import { Request, Response } from 'express'
import crypto from 'crypto'
import User from '../models/User'
import Workspace from '../models/Workspace'
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken'
import { sendEmail } from '../utils/sendEmail'
import { AuthRequest } from '../middleware/auth'
// @POST /api/auth/register (Admin only)
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, workspaceName } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) return res.status(400).json({ message: 'Email already exists' })

    // Create workspace first
    const workspace = await Workspace.create({
      name: workspaceName,
      
      inviteCode: crypto.randomBytes(6).toString('hex')
    })

    // Create admin user
    const user = await User.create({
      name,
      email,
      password,
      role: 'admin',
      workspaceId: workspace._id,
      isEmailVerified: true,
      inviteAccepted: true
    })

    // Update workspace adminId
    workspace.adminId = user._id
    await workspace.save()

    const accessToken = generateAccessToken(user._id.toString(), user.role, workspace._id.toString())
    const refreshToken = generateRefreshToken(user._id.toString())

    user.refreshToken = refreshToken
    await user.save()

    res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000
})

    res.status(201).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: workspace._id,
        workspaceName: workspace.name
      }
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/auth/login
// @POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password +refreshToken')
    if (!user || !user.password) return res.status(401).json({ message: 'Invalid credentials' })

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' })

    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' })

    // Find workspace safely
    const workspace = user.workspaceId ? await Workspace.findById(user.workspaceId) : null;

    // FIX: Safely convert workspaceId to string, fallback to empty string if undefined
    const safeWorkspaceId = user.workspaceId ? user.workspaceId.toString() : '';
    
    const accessToken = generateAccessToken(user._id.toString(), user.role, safeWorkspaceId)
    const refreshToken = generateRefreshToken(user._id.toString())

    user.refreshToken = refreshToken
    user.lastLoginAt = new Date()
    await user.save()

    res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000
})

    res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
        workspaceName: workspace?.name
      }
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/auth/refresh-token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken
    if (!token) return res.status(401).json({ message: 'No refresh token' })

    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any

    const user = await User.findById(decoded.userId).select('+refreshToken')
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: 'Invalid refresh token' })
    }

    const safeWorkspaceId = user.workspaceId ? user.workspaceId.toString() : '';
const accessToken = generateAccessToken(user._id.toString(), user.role, safeWorkspaceId)
    const newRefreshToken = generateRefreshToken(user._id.toString())

    user.refreshToken = newRefreshToken
    await user.save()

   res.cookie('refreshToken', newRefreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000
})

    res.json({ success: true, accessToken })
  } catch (error: any) {
    res.status(401).json({ message: 'Invalid refresh token' })
  }
}

// @POST /api/auth/forgot-password
// TEMP (for demo, until Resend domain is verified): the OTP is echoed back
// in the API response and logged to the server console, so the flow works
// end-to-end even when the email never arrives. Remove `otp` from the JSON
// response (and ideally the console.log) once real email delivery works —
// leaking the OTP in the response is not safe for real production use.
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    user.forgotPasswordToken = otp
    user.forgotPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000)
    await user.save()

    console.log(`🔑 [DEMO] Password reset OTP for ${email}: ${otp}`)

    // Still attempt email — but don't let a delivery failure block the flow.
    sendEmail({
      to: email,
      subject: 'MeetingMind - Password Reset OTP',
      html: `<p>Your OTP for password reset is: <strong>${otp}</strong></p><p>This OTP expires in 15 minutes.</p>`
    }).catch(() => {})

    res.json({
      success: true,
      message: 'OTP generated',
      otp // TEMP: remove once email delivery is fixed
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/auth/verify-otp
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body
    const user = await User.findOne({
      email,
      forgotPasswordToken: otp,
      forgotPasswordExpiry: { $gt: new Date() }
    })

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' })

    res.json({ success: true, message: 'OTP verified' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/auth/forgot-password-direct
// TEMP (until email delivery is fixed): skips the OTP step entirely — just
// email + new password, straight update. Not secure for real production
// (anyone who knows an email can reset that account's password), but works
// for a demo where email isn't reaching users yet. Swap back to the OTP
// flow (forgotPassword + verifyOtp + resetPassword above) once email works.
export const directResetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' })
    }

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.password = newPassword
    user.forgotPasswordToken = undefined
    user.forgotPasswordExpiry = undefined
    await user.save()

    res.json({ success: true, message: 'Password reset successful' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body
    const user = await User.findOne({
      email,
      forgotPasswordToken: otp,
      forgotPasswordExpiry: { $gt: new Date() }
    })

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' })

    user.password = newPassword
    user.forgotPasswordToken = undefined
    user.forgotPasswordExpiry = undefined
    await user.save()

    res.json({ success: true, message: 'Password reset successful' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken
    if (token) {
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any
      await User.findByIdAndUpdate(decoded.userId, { refreshToken: undefined })
    }
    res.clearCookie('refreshToken')
    res.json({ success: true, message: 'Logged out' })
  } catch {
    res.clearCookie('refreshToken')
    res.json({ success: true, message: 'Logged out' })
  }
}

// @GET /api/auth/google/callback
// If the Google account has no existing User record (i.e. was never invited
// by an admin), they are a brand-new signup and must create an organization
// before they can use the app. Invited users (students) already have
// workspaceId set by the admin invite, so they skip onboarding entirely.
export const googleCallback = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as any
    console.log('🟢 googleCallback user:', user?._id, user?.role, user?.workspaceId)

    const accessToken = generateAccessToken(user._id.toString(), user.role, user.workspaceId?.toString() || '')
    const refreshTokenValue = generateRefreshToken(user._id.toString())

    user.refreshToken = refreshTokenValue
    await user.save()

    res.cookie('refreshToken', refreshTokenValue, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000
})

    const needsOnboarding = !user.workspaceId

    const redirectUrl = needsOnboarding
      ? `${process.env.FRONTEND_URL}/onboarding?token=${accessToken}&name=${encodeURIComponent(user.name)}`
      : `${process.env.FRONTEND_URL}/google-success?token=${accessToken}&name=${encodeURIComponent(user.name)}&role=${user.role}&workspaceId=${user.workspaceId || ''}`

    console.log('🟢 Redirecting to:', redirectUrl)
    res.redirect(redirectUrl)
  } catch (error: any) {
    console.log('🔴 googleCallback error:', error.message)
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`)
  }
}

// @POST /api/auth/complete-onboarding (protected — token from Google signup)
// Only reachable by users who signed up via Google with no prior admin
// invite. Creates a brand-new workspace and promotes the user to admin.
export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceName } = req.body
    if (!workspaceName || !workspaceName.trim()) {
      return res.status(400).json({ message: 'Organization name is required' })
    }

    const user = await User.findById(req.user!.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (user.workspaceId) {
      return res.status(400).json({ message: 'Onboarding already completed' })
    }

    const workspace = await Workspace.create({
      name: workspaceName.trim(),
      inviteCode: crypto.randomBytes(6).toString('hex')
    })

    user.role = 'admin'
    user.workspaceId = workspace._id as any
    user.inviteAccepted = true
    await user.save()

    workspace.adminId = user._id as any
    await workspace.save()

    const accessToken = generateAccessToken(user._id.toString(), user.role, workspace._id.toString())
    const newRefreshToken = generateRefreshToken(user._id.toString())

    user.refreshToken = newRefreshToken
    await user.save()

    res.cookie('refreshToken', newRefreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000
})

    res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: workspace._id,
        workspaceName: workspace.name
      }
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}