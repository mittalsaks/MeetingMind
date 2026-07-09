import nodemailer from 'nodemailer'
import dns from 'dns'

const resolver = new dns.Resolver()
resolver.setServers(['8.8.8.8'])

function resolveIPv4(hostname: string): Promise<string> {
  return new Promise((resolve, reject) => {
    resolver.resolve4(hostname, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        return reject(err || new Error('No IPv4 address found'))
      }
      resolve(addresses[0])
    })
  })
}

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const ip = await resolveIPv4('smtp.gmail.com')

    const transporter = nodemailer.createTransport({
      host: ip,
      port: 465,
      secure: true,
      tls: {
        servername: 'smtp.gmail.com'
      },
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