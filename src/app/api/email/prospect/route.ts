import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    const { to, listingTitle, prospectName } = await request.json()

    if (!to || !listingTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!resend) {
      console.log('Email service not configured, skipping email to:', to)
      return NextResponse.json({ 
        success: true, 
        message: 'Email service not configured (development mode)' 
      })
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'MIDWAY <notifications@midway.com>',
      to: [to],
      subject: `New Interest in "${listingTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #fafafa; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; border-radius: 16px; padding: 32px; border: 1px solid #27272a;">
              <h1 style="color: #a78bfa; margin: 0 0 24px; font-size: 24px;">
                New Interest in Your Listing
              </h1>
              
              <p style="color: #a1a1aa; margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
                Great news! <strong style="color: #fafafa;">${prospectName || 'Someone'}</strong> has expressed interest in your listing:
              </p>
              
              <div style="background-color: #27272a; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h2 style="color: #fafafa; margin: 0; font-size: 18px;">
                  ${listingTitle}
                </h2>
              </div>
              
              <p style="color: #a1a1aa; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
                Visit your Prospects Dashboard to view their profile and get in touch.
              </p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://midway.com'}/dashboard/prospects" 
                 style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View Prospect
              </a>
              
              <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;">
              
              <p style="color: #71717a; font-size: 12px; margin: 0;">
                You're receiving this email because you have listings on MIDWAY.
                <br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://midway.com'}/settings/notifications" style="color: #71717a;">
                  Manage notification preferences
                </a>
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Email send error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
