import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const { error } = await resend.emails.send({
      from: 'MeetingMind <onboarding@resend.dev>',
      to,
      subject,
      html
    })
    if (error) {
      console.error('Email send error:', error)
      return false
    }
    console.log(`Email sent to ${to}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}