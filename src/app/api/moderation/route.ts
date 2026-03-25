import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { moderateContent, type ContentType } from '@/lib/moderation'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ModerationRequest {
  text: string
  type: ContentType
  contentId?: string
  price?: number
  urls?: string[]
  language?: string
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (!error && user) {
        userId = user.id
      }
    }

    const body: ModerationRequest = await request.json()

    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text field' },
        { status: 400 }
      )
    }

    if (!body.type || !['listing', 'comment', 'message'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be listing, comment, or message' },
        { status: 400 }
      )
    }

    const result = await moderateContent({
      text: body.text,
      type: body.type,
      price: body.price,
      urls: body.urls,
      language: body.language,
    })

    await supabaseAdmin.from('moderation_logs').insert({
      content_type: body.type,
      content_id: body.contentId || null,
      user_id: userId,
      tisane_flagged: result.tisane.flagged,
      tisane_categories: result.tisane.categories,
      openai_flagged: result.openai.flagged,
      openai_categories: result.openai.categoryScores,
      custom_flagged: result.custom.flagged,
      custom_reasons: result.custom.reasons,
      approved: result.approved,
      severity: result.severity,
    })

    return NextResponse.json({
      approved: result.approved,
      flagged: result.flagged,
      severity: result.severity,
      flags: result.flags,
      requiresReview: result.requiresReview,
    })
  } catch (error) {
    console.error('Moderation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
