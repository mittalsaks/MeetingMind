import cron from 'node-cron'
import Meeting from '../models/Meeting'
import Workspace from '../models/Workspace'
import User from '../models/User'
import { sendEmail } from '../utils/sendEmail'

export function startWeeklyMeetingConfirmationCron() {
  // Runs every Monday at 9:00 AM IST (03:30 UTC)
  cron.schedule('30 3 * * 1', async () => {
    console.log('🕐 Weekly meeting confirmation cron running...')
    try {
      const weekStart = new Date()
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      // Meetings scheduled for this week that the admin hasn't confirmed yet
      const meetings = await Meeting.find({
        scheduledDate: { $gte: weekStart, $lt: weekEnd },
        status: 'scheduled',
      })

      console.log(`📋 Found ${meetings.length} unconfirmed meeting(s) this week`)

      for (const meeting of meetings) {
        const workspace = await Workspace.findById(meeting.workspaceId)
        if (!workspace || !workspace.adminId) continue

        const admin = await User.findById(workspace.adminId)
        if (!admin || !admin.email) continue

        await sendEmail({
          to: admin.email,
          subject: '📅 Confirm this week\'s meeting',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #111;">Meeting Confirmation Needed</h2>
              <p>Hi ${admin.name},</p>
              <p>You have a meeting scheduled for <strong>${meeting.scheduledDate.toDateString()}</strong> at <strong>${meeting.scheduledTime}</strong> that hasn't been confirmed yet.</p>
              <a href="${process.env.FRONTEND_URL}/meetings"
                 style="display:inline-block;margin-top:16px;padding:10px 20px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;">
                Confirm Meeting
              </a>
              <p style="margin-top:24px;color:#888;font-size:12px;">MeetingMind</p>
            </div>
          `,
        })
        console.log(`📧 Confirmation reminder sent to ${admin.email} for meeting ${meeting._id}`)
      }
    } catch (err) {
      console.error('Weekly meeting confirmation cron error:', err)
    }
  })

  console.log('✅ Weekly meeting confirmation cron scheduled (Monday 9AM IST)')
}