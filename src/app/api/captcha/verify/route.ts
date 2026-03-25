import { NextRequest, NextResponse } from 'next/server'

const HCAPTCHA_VERIFY_URL = 'https://hcaptcha.com/siteverify'
const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET

interface HCaptchaVerifyResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  credit?: boolean
  'error-codes'?: string[]
}

export async function POST(request: NextRequest) {
  try {
    if (!HCAPTCHA_SECRET) {
      console.error('HCAPTCHA_SECRET not configured')
      return NextResponse.json(
        { success: false, error: 'Captcha not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing captcha token' },
        { status: 400 }
      )
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     ''

    const formData = new URLSearchParams()
    formData.append('secret', HCAPTCHA_SECRET)
    formData.append('response', token)
    if (clientIp) {
      formData.append('remoteip', clientIp)
    }

    const response = await fetch(HCAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      console.error('hCaptcha verification request failed:', response.status)
      return NextResponse.json(
        { success: false, error: 'Verification request failed' },
        { status: 500 }
      )
    }

    const data: HCaptchaVerifyResponse = await response.json()

    if (data.success) {
      return NextResponse.json({
        success: true,
        timestamp: data.challenge_ts,
        hostname: data.hostname,
      })
    } else {
      const errorCodes = data['error-codes'] || []
      console.warn('hCaptcha verification failed:', errorCodes)
      
      return NextResponse.json({
        success: false,
        error: 'Captcha verification failed',
        codes: errorCodes,
      })
    }
  } catch (error) {
    console.error('Captcha verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
