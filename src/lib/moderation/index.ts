import { checkWithTisane, type TisaneResult } from './tisane'
import { checkWithOpenAI, type OpenAIResult } from './openai'
import { checkWithCustomRules, type CustomRulesResult } from './rules'

export type ContentType = 'listing' | 'comment' | 'message'
export type Severity = 'low' | 'medium' | 'high'

export interface ModerationInput {
  text: string
  type: ContentType
  price?: number
  urls?: string[]
  language?: string
}

export interface ModerationResult {
  approved: boolean
  flagged: boolean
  severity: Severity
  flags: string[]
  tisane: TisaneResult
  openai: OpenAIResult
  custom: CustomRulesResult
  requiresReview: boolean
}

function combineSeverity(...severities: Severity[]): Severity {
  if (severities.includes('high')) return 'high'
  if (severities.includes('medium')) return 'medium'
  return 'low'
}

export async function moderateContent(input: ModerationInput): Promise<ModerationResult> {
  const [tisaneResult, openaiResult] = await Promise.all([
    checkWithTisane(input.text, input.language || 'en'),
    checkWithOpenAI(input.text),
  ])

  const customResult = checkWithCustomRules(input.text, {
    type: input.type,
    price: input.price,
    urls: input.urls,
  })

  const allFlags: string[] = []

  if (tisaneResult.flagged) {
    allFlags.push(...tisaneResult.reasons.map(r => `[Tisane] ${r}`))
  }

  if (openaiResult.flagged) {
    allFlags.push(...openaiResult.reasons.map(r => `[OpenAI] ${r}`))
  }

  if (customResult.flagged) {
    allFlags.push(...customResult.reasons.map(r => `[Custom] ${r}`))
  }

  const severity = combineSeverity(
    tisaneResult.severity,
    openaiResult.severity,
    customResult.severity
  )

  const flagged = tisaneResult.flagged || openaiResult.flagged || customResult.flagged

  const requiresReview = severity === 'high' || 
                         (severity === 'medium' && allFlags.length > 2) ||
                         openaiResult.categories.hate ||
                         openaiResult.categories.violence ||
                         tisaneResult.categories.hate_speech > 0.5

  const approved = !flagged || (severity === 'low' && allFlags.length <= 1)

  return {
    approved,
    flagged,
    severity,
    flags: allFlags,
    tisane: tisaneResult,
    openai: openaiResult,
    custom: customResult,
    requiresReview,
  }
}

export { checkWithTisane, checkWithOpenAI, checkWithCustomRules }
export type { TisaneResult, OpenAIResult, CustomRulesResult }

export {
  checkContentModeration,
  moderateListingContent,
  moderateCommentContent,
  moderateMessageContent,
} from './client'
export type { ModerationCheckResult, ModerationCheckInput } from './client'
