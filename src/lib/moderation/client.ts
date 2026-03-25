export interface ModerationCheckResult {
  approved: boolean
  flagged: boolean
  severity: 'low' | 'medium' | 'high'
  flags: string[]
  requiresReview: boolean
}

export interface ModerationCheckInput {
  text: string
  type: 'listing' | 'comment' | 'message'
  contentId?: string
  price?: number
  urls?: string[]
  language?: string
}

export async function checkContentModeration(
  input: ModerationCheckInput,
  authToken?: string
): Promise<ModerationCheckResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const response = await fetch('/api/moderation', {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      console.error('Moderation check failed:', response.status)
      return {
        approved: true,
        flagged: false,
        severity: 'low',
        flags: [],
        requiresReview: false,
      }
    }

    return await response.json()
  } catch (error) {
    console.error('Moderation check error:', error)
    return {
      approved: true,
      flagged: false,
      severity: 'low',
      flags: [],
      requiresReview: false,
    }
  }
}

export async function moderateListingContent(
  title: string,
  description: string,
  price?: number,
  urls?: string[],
  authToken?: string
): Promise<ModerationCheckResult> {
  const combinedText = `${title}\n\n${description}`
  
  return checkContentModeration(
    {
      text: combinedText,
      type: 'listing',
      price,
      urls,
    },
    authToken
  )
}

export async function moderateCommentContent(
  content: string,
  authToken?: string
): Promise<ModerationCheckResult> {
  return checkContentModeration(
    {
      text: content,
      type: 'comment',
    },
    authToken
  )
}

export async function moderateMessageContent(
  content: string,
  authToken?: string
): Promise<ModerationCheckResult> {
  return checkContentModeration(
    {
      text: content,
      type: 'message',
    },
    authToken
  )
}
