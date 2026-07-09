interface EmailOptions {
  to: string
  subject: string
  html: string
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'MeetingMind <onboarding@resend.dev>',
        to: [to],
        subject,
        html
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Resend API error: ${response.status} - ${errorData}`)
    }

    console.log(`Email sent to ${to}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}