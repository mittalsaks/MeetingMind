import express from 'express'
import passport from '../config/passport'
import { protect } from '../middleware/auth'
import {
  register,
  login,
  refreshToken,
  forgotPassword,
  verifyOtp,
  resetPassword,
  logout,
  googleCallback,
  completeOnboarding
} from '../controllers/auth.controller'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh-token', refreshToken)
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)
router.post('/logout', logout)
router.post('/complete-onboarding', protect, completeOnboarding)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false, prompt: 'select_account' }))
router.get('/google/callback', 
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err: any, user: any, info: any) => {
      console.log('🔴 Google callback:', JSON.stringify(err), JSON.stringify(user?._id), JSON.stringify(info))
      if (err || !user) {
        return res.redirect(`http://localhost:3000/login?error=google_failed`)
      }
      req.user = user
      next()
    })(req, res, next)
  },
  googleCallback
)
export default router