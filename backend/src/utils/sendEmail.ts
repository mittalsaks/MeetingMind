import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      family: 4,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    })

    await transporter.sendMail({
      from: `"MeetingMind" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    })
    console.log(`Email sent to ${to}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}