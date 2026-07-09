interface EmailOptions {
  to: string
  subject: string
  html: string
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string
      },
      body: JSON.stringify({
        sender: {
          name: 'MeetingMind',
          email: process.env.EMAIL_USER
        },
        to: [{ email: to }],
        subject,
        htmlContent: html
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Brevo API error: ${response.status} - ${errorData}`)
    }

    console.log(`Email sent to ${to}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}