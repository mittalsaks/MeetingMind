import cron from 'node-cron'
import User from '../models/User'
import DailyUpdate from '../models/DailyUpdate'
import { sendEmail } from '../utils/sendEmail'

export function startDailyReminderCron() {
  // Runs every day at 8:00 PM IST (14:30 UTC)
    cron.schedule('30 14 * * *', async () => {
    console.log('🕐 Daily reminder cron running...')
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get all active, invite-accepted students
      const students = await User.find({
        role: 'user',
        isActive: true,
        inviteAccepted: true,
      })

      for (const student of students) {
        // Check if they submitted today's update
        const update = await DailyUpdate.findOne({
          userId: student._id,
          workspaceId: student.workspaceId,
          createdAt: { $gte: today },
        })

        if (!update) {
          await sendEmail({
            to: student.email,
            subject: '⏰ Reminder: Submit your daily update',
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #111;">Daily Update Reminder</h2>
                <p>Hi ${student.name},</p>
                <p>You haven't submitted your daily update yet today. Your mentor is waiting!</p>
                <a href="${process.env.FRONTEND_URL}/daily-updates" 
                   style="display:inline-block;margin-top:16px;padding:10px 20px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;">
                  Submit Update
                </a>
                <p style="margin-top:24px;color:#888;font-size:12px;">MeetingMind</p>
              </div>
            `,
          })
          console.log(`📧 Reminder sent to ${student.email}`)
        }
      }
    } catch (err) {
      console.error('Cron error:', err)
    }
  })

  console.log('✅ Daily reminder cron scheduled (8PM IST)')
}