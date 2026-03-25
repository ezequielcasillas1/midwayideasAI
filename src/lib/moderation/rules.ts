export interface CustomRulesResult {
  flagged: boolean
  reasons: string[]
  severity: 'low' | 'medium' | 'high'
}

const SCAM_KEYWORDS = [
  'guaranteed profit',
  'double your money',
  'risk free',
  'act now',
  'limited time',
  'wire transfer',
  'western union',
  'cryptocurrency wallet',
  'send bitcoin',
  'nigerian prince',
  'lottery winner',
  'inheritance fund',
  'bank account details',
  'social security',
  'credit card number',
  'password reset',
  'verify your account',
  'suspended account',
  'click here immediately',
]

const SUSPICIOUS_PATTERNS = [
  /\b(?:free\s+money|easy\s+cash|make\s+\$?\d+k?\s+(?:fast|quick|easy))\b/i,
  /\b(?:telegram|whatsapp|signal)\s*:?\s*[@+]?\s*[\w\d]+/i,
  /\b(?:dm\s+me|message\s+me\s+privately)\b/i,
  /\b(?:100%\s+(?:guaranteed|safe|legit))\b/i,
  /\b(?:no\s+scam|not\s+a\s+scam|trust\s+me)\b/i,
]

const CONTACT_INFO_PATTERNS = [
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/,
  /\b(?:\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
]

const URL_PATTERNS = {
  suspicious: [
    /bit\.ly|tinyurl|t\.co|goo\.gl|rb\.gy/i,
    /(?:porn|xxx|adult|sex|nude)/i,
    /(?:casino|gambling|betting|slots)/i,
  ],
  valid: /^https?:\/\/(?:github\.com|gitlab\.com|bitbucket\.org|vercel\.app|netlify\.app|herokuapp\.com)/i,
}

interface RulesContext {
  type: 'listing' | 'comment' | 'message'
  price?: number
  urls?: string[]
}

function checkScamKeywords(text: string): string[] {
  const lowerText = text.toLowerCase()
  return SCAM_KEYWORDS.filter(keyword => lowerText.includes(keyword))
}

function checkSuspiciousPatterns(text: string): string[] {
  const matches: string[] = []
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      matches.push(`Suspicious pattern detected`)
    }
  }
  return matches
}

function checkContactInfo(text: string, context: RulesContext): string[] {
  if (context.type === 'listing') return []
  
  const issues: string[] = []
  for (const pattern of CONTACT_INFO_PATTERNS) {
    if (pattern.test(text)) {
      issues.push('Contains contact information outside listings')
    }
  }
  return issues
}

function checkPricingAnomaly(price: number | undefined, text: string): string[] {
  if (price === undefined) return []
  
  const issues: string[] = []
  
  if (price <= 0) {
    issues.push('Invalid or zero price')
  }
  
  if (price > 1000000) {
    issues.push('Unusually high price')
  }
  
  const priceMatches = text.match(/\$[\d,]+/g)
  if (priceMatches) {
    for (const match of priceMatches) {
      const mentioned = parseInt(match.replace(/[$,]/g, ''), 10)
      if (mentioned && Math.abs(mentioned - price) > price * 0.5) {
        issues.push('Price in description differs significantly from listed price')
        break
      }
    }
  }
  
  return issues
}

function checkUrls(urls: string[] | undefined): string[] {
  if (!urls || urls.length === 0) return []
  
  const issues: string[] = []
  
  for (const url of urls) {
    for (const pattern of URL_PATTERNS.suspicious) {
      if (pattern.test(url)) {
        issues.push(`Suspicious URL detected: ${url.substring(0, 50)}`)
        break
      }
    }
  }
  
  return issues
}

function checkContentQuality(text: string, context: RulesContext): string[] {
  const issues: string[] = []
  
  if (context.type === 'listing') {
    if (text.length < 50) {
      issues.push('Description too short')
    }
    
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length
    if (capsRatio > 0.5 && text.length > 20) {
      issues.push('Excessive use of capital letters')
    }
    
    const exclamations = (text.match(/!/g) || []).length
    if (exclamations > 5) {
      issues.push('Excessive exclamation marks')
    }
  }
  
  return issues
}

export function checkWithCustomRules(text: string, context: RulesContext = { type: 'listing' }): CustomRulesResult {
  const allIssues: string[] = []
  
  allIssues.push(...checkScamKeywords(text))
  allIssues.push(...checkSuspiciousPatterns(text))
  allIssues.push(...checkContactInfo(text, context))
  allIssues.push(...checkPricingAnomaly(context.price, text))
  allIssues.push(...checkUrls(context.urls))
  allIssues.push(...checkContentQuality(text, context))
  
  const uniqueIssues = [...new Set(allIssues)]
  
  let severity: 'low' | 'medium' | 'high' = 'low'
  if (uniqueIssues.some(i => i.includes('scam') || i.includes('Suspicious URL'))) {
    severity = 'high'
  } else if (uniqueIssues.length > 2) {
    severity = 'medium'
  } else if (uniqueIssues.length > 0) {
    severity = 'low'
  }
  
  return {
    flagged: uniqueIssues.length > 0,
    reasons: uniqueIssues,
    severity,
  }
}
