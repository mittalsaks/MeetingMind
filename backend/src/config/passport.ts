import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import User from '../models/User'

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value
        if (!email) return done(new Error('No email from Google'), undefined)

        // Check if user already exists
        let user = await User.findOne({ email })

        if (!user) {
          // New user — create with no workspace (they'll need an invite)
          user = await User.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            isEmailVerified: true,
            inviteAccepted: false,
            isActive: true,
            role: 'user',
          })
        } else {
          // Existing user — update googleId if not set
          if (!user.googleId) {
            user.googleId = profile.id
            await user.save()
          }
        }

        return done(null, user)
      } catch (err) {
        return done(err, undefined)
      }
    }
  )
)

export default passport