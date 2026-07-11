import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    await transporter.sendMail({
      from: `"MeetingMind" <${process.env.GMAIL_USER}>`,
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
