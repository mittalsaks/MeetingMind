import { google } from 'googleapis'

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_API_CLIENT_ID,
  process.env.GMAIL_API_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
)

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_API_REFRESH_TOKEN,
})

interface EmailOptions {
  to: string
  subject: string
  html: string
}

function createEmailRaw(to: string, from: string, subject: string, html: string) {
  const messageParts = [
    `To: ${to}`,
    `From: MeetingMind <${from}>`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ]
  const message = messageParts.join('\n')

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

    const raw = createEmailRaw(to, process.env.GMAIL_API_SENDER_EMAIL!, subject, html)

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    })

    console.log(`Email sent to ${to}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}