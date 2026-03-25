const OPENAI_API_URL = 'https://api.openai.com/v1/moderations'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export interface OpenAIResult {
  flagged: boolean
  categories: {
    sexual: boolean
    hate: boolean
    harassment: boolean
    'self-harm': boolean
    violence: boolean
    'hate/threatening': boolean
    'harassment/threatening': boolean
    'self-harm/intent': boolean
    'self-harm/instructions': boolean
    'violence/graphic': boolean
  }
  categoryScores: Record<string, number>
  reasons: string[]
  severity: 'low' | 'medium' | 'high'
}

interface OpenAIModerationResponse {
  id: string
  model: string
  results: Array<{
    flagged: boolean
    categories: Record<string, boolean>
    category_scores: Record<string, number>
  }>
}

function determineSeverity(scores: Record<string, number>): 'low' | 'medium' | 'high' {
  const maxScore = Math.max(...Object.values(scores))
  if (maxScore > 0.8) return 'high'
  if (maxScore > 0.5) return 'medium'
  return 'low'
}

export async function checkWithOpenAI(text: string): Promise<OpenAIResult> {
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not configured, skipping OpenAI moderation')
    return {
      flagged: false,
      categories: {
        sexual: false,
        hate: false,
        harassment: false,
        'self-harm': false,
        violence: false,
        'hate/threatening': false,
        'harassment/threatening': false,
        'self-harm/intent': false,
        'self-harm/instructions': false,
        'violence/graphic': false,
      },
      categoryScores: {},
      reasons: [],
      severity: 'low',
    }
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI Moderation API error:', response.status, await response.text())
      return {
        flagged: false,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          'self-harm': false,
          violence: false,
          'hate/threatening': false,
          'harassment/threatening': false,
          'self-harm/intent': false,
          'self-harm/instructions': false,
          'violence/graphic': false,
        },
        categoryScores: {},
        reasons: ['API error'],
        severity: 'low',
      }
    }

    const data: OpenAIModerationResponse = await response.json()
    const result = data.results[0]

    if (!result) {
      return {
        flagged: false,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          'self-harm': false,
          violence: false,
          'hate/threatening': false,
          'harassment/threatening': false,
          'self-harm/intent': false,
          'self-harm/instructions': false,
          'violence/graphic': false,
        },
        categoryScores: {},
        reasons: [],
        severity: 'low',
      }
    }

    const reasons: string[] = []
    for (const [category, flagged] of Object.entries(result.categories)) {
      if (flagged) {
        reasons.push(category.replace(/[/-]/g, ' '))
      }
    }

    return {
      flagged: result.flagged,
      categories: result.categories as OpenAIResult['categories'],
      categoryScores: result.category_scores,
      reasons,
      severity: determineSeverity(result.category_scores),
    }
  } catch (error) {
    console.error('OpenAI moderation check failed:', error)
    return {
      flagged: false,
      categories: {
        sexual: false,
        hate: false,
        harassment: false,
        'self-harm': false,
        violence: false,
        'hate/threatening': false,
        'harassment/threatening': false,
        'self-harm/intent': false,
        'self-harm/instructions': false,
        'violence/graphic': false,
      },
      categoryScores: {},
      reasons: ['Check failed'],
      severity: 'low',
    }
  }
}
