import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
})

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    await transporter.sendMail({
      from: `"MeetingMind" <${process.env.BREVO_SENDER_EMAIL}>`,
      to,
      subject,
      html,
    })
    console.log(`Email sent to ${to}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}