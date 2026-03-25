const TISANE_API_URL = 'https://api.tisane.ai/parse'
const TISANE_API_KEY = process.env.TISANE_API_KEY

export interface TisaneResult {
  flagged: boolean
  categories: {
    toxicity: number
    profanity: number
    spam: number
    personal_attack: number
    hate_speech: number
  }
  reasons: string[]
  severity: 'low' | 'medium' | 'high'
  raw?: unknown
}

interface TisaneResponse {
  abuse?: Array<{
    type: string
    severity: string
    text?: string
    explanation?: string
  }>
  sentiment_expressions?: Array<{
    polarity: string
    reasons?: string[]
  }>
  entities_summary?: unknown
}

function mapSeverity(tisaneSeverity: string): 'low' | 'medium' | 'high' {
  switch (tisaneSeverity?.toLowerCase()) {
    case 'extreme':
    case 'high':
      return 'high'
    case 'medium':
      return 'medium'
    default:
      return 'low'
  }
}

function calculateCategoryScores(abuse: TisaneResponse['abuse']): TisaneResult['categories'] {
  const categories = {
    toxicity: 0,
    profanity: 0,
    spam: 0,
    personal_attack: 0,
    hate_speech: 0,
  }

  if (!abuse || abuse.length === 0) return categories

  for (const item of abuse) {
    const severityScore = item.severity === 'extreme' ? 1.0 : 
                          item.severity === 'high' ? 0.8 : 
                          item.severity === 'medium' ? 0.5 : 0.3

    switch (item.type?.toLowerCase()) {
      case 'profanity':
      case 'obscene':
        categories.profanity = Math.max(categories.profanity, severityScore)
        categories.toxicity = Math.max(categories.toxicity, severityScore * 0.7)
        break
      case 'personal_attack':
      case 'bigotry':
        categories.personal_attack = Math.max(categories.personal_attack, severityScore)
        categories.toxicity = Math.max(categories.toxicity, severityScore)
        break
      case 'hate_speech':
      case 'criminal_activity':
        categories.hate_speech = Math.max(categories.hate_speech, severityScore)
        categories.toxicity = Math.max(categories.toxicity, severityScore)
        break
      case 'spam':
      case 'data':
        categories.spam = Math.max(categories.spam, severityScore)
        break
      default:
        categories.toxicity = Math.max(categories.toxicity, severityScore * 0.5)
    }
  }

  return categories
}

export async function checkWithTisane(text: string, language: string = 'en'): Promise<TisaneResult> {
  if (!TISANE_API_KEY) {
    console.warn('TISANE_API_KEY not configured, skipping Tisane check')
    return {
      flagged: false,
      categories: { toxicity: 0, profanity: 0, spam: 0, personal_attack: 0, hate_speech: 0 },
      reasons: [],
      severity: 'low',
    }
  }

  try {
    const response = await fetch(TISANE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': TISANE_API_KEY,
      },
      body: JSON.stringify({
        language,
        content: text,
        settings: {
          abuse: true,
          sentiment: true,
          snippets: true,
          explain: true,
        },
      }),
    })

    if (!response.ok) {
      console.error('Tisane API error:', response.status, await response.text())
      return {
        flagged: false,
        categories: { toxicity: 0, profanity: 0, spam: 0, personal_attack: 0, hate_speech: 0 },
        reasons: ['API error'],
        severity: 'low',
      }
    }

    const data: TisaneResponse = await response.json()
    const abuse = data.abuse || []
    const categories = calculateCategoryScores(abuse)
    const reasons = abuse.map(a => a.explanation || a.type).filter(Boolean)
    
    const maxSeverity = abuse.reduce((max, item) => {
      const current = mapSeverity(item.severity)
      if (current === 'high') return 'high'
      if (current === 'medium' && max !== 'high') return 'medium'
      return max
    }, 'low' as 'low' | 'medium' | 'high')

    const flagged = abuse.length > 0 || 
                    categories.toxicity > 0.5 || 
                    categories.profanity > 0.7 ||
                    categories.hate_speech > 0.3

    return {
      flagged,
      categories,
      reasons,
      severity: maxSeverity,
      raw: data,
    }
  } catch (error) {
    console.error('Tisane check failed:', error)
    return {
      flagged: false,
      categories: { toxicity: 0, profanity: 0, spam: 0, personal_attack: 0, hate_speech: 0 },
      reasons: ['Check failed'],
      severity: 'low',
    }
  }
}
