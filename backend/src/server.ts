import dotenv from 'dotenv'
dotenv.config()
import { startWeeklyMeetingConfirmationCron } from './jobs/weeklyMeetingConfirmation'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import authRoutes from './routes/auth.routes'
import taskRoutes from './routes/task.routes'
import workspaceRoutes from './routes/workspace.routes'
import dailyUpdateRoutes from './routes/dailyUpdate.routes'
import leaveRoutes from './routes/leave.routes'
import meetingRoutes from './routes/meeting.routes'
import attendanceRoutes from './routes/attendance.routes'
import adminRoutes from './routes/admin.routes'
import { startDailyReminderCron } from './jobs/dailyReminder'
import passport from './config/passport'

const app = express()

app.set('trust proxy', 1)

app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map(o => o.trim())
    
    // No origin (mobile apps, curl, Postman) — allow karo
    if (!origin) return callback(null, true)

    // Chrome extension requests — allow karo (extension ID changes per install)
    if (origin.startsWith('chrome-extension://')) return callback(null, true)
    
    if (allowed.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS blocked: ${origin}`))
    }
  },
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(passport.initialize())
app.use(cookieParser())

mongoose.connect(process.env.MONGO_URI!)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Error:', err))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MeetingMind Backend Running' })
})
app.use('/downloads', express.static(path.join(__dirname, 'public')))
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/workspace', workspaceRoutes)
app.use('/api/daily-updates', dailyUpdateRoutes)
app.use('/api/leave-requests', leaveRoutes)
app.use('/api/meetings', meetingRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/admin', adminRoutes)
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT)
})
startDailyReminderCron()
startWeeklyMeetingConfirmationCron()
export default app
