export type TrustLevel = 'unverified' | 'basic' | 'verified' | 'trusted' | 'elite'

export interface TrustScoreInput {
  emailVerified: boolean
  profileComplete: boolean
  githubConnected: boolean
  googleConnected: boolean
  phoneVerified: boolean
  idVerified: boolean
  hasListings: boolean
  successfulSales: number
  accountAgeMonths: number
}

const TRUST_POINTS = {
  email_verified: 10,
  profile_complete: 5,
  github_connected: 20,
  google_connected: 10,
  phone_verified: 25,
  id_verified: 50,
  first_listing: 15,
  five_sales: 30,
  ten_sales: 20,
  one_year: 20,
  two_years: 15,
}

const TRUST_LEVEL_THRESHOLDS: Record<TrustLevel, number> = {
  unverified: 0,
  basic: 15,
  verified: 50,
  trusted: 100,
  elite: 150,
}

export function calculateTrustScore(input: TrustScoreInput): number {
  let score = 0

  if (input.emailVerified) {
    score += TRUST_POINTS.email_verified
  }

  if (input.profileComplete) {
    score += TRUST_POINTS.profile_complete
  }

  if (input.githubConnected) {
    score += TRUST_POINTS.github_connected
  }

  if (input.googleConnected) {
    score += TRUST_POINTS.google_connected
  }

  if (input.phoneVerified) {
    score += TRUST_POINTS.phone_verified
  }

  if (input.idVerified) {
    score += TRUST_POINTS.id_verified
  }

  if (input.hasListings) {
    score += TRUST_POINTS.first_listing
  }

  if (input.successfulSales >= 5) {
    score += TRUST_POINTS.five_sales
  }

  if (input.successfulSales >= 10) {
    score += TRUST_POINTS.ten_sales
  }

  if (input.accountAgeMonths >= 12) {
    score += TRUST_POINTS.one_year
  }

  if (input.accountAgeMonths >= 24) {
    score += TRUST_POINTS.two_years
  }

  return score
}

export function getTrustLevel(score: number): TrustLevel {
  if (score >= TRUST_LEVEL_THRESHOLDS.elite) return 'elite'
  if (score >= TRUST_LEVEL_THRESHOLDS.trusted) return 'trusted'
  if (score >= TRUST_LEVEL_THRESHOLDS.verified) return 'verified'
  if (score >= TRUST_LEVEL_THRESHOLDS.basic) return 'basic'
  return 'unverified'
}

export function getTrustLevelLabel(level: TrustLevel): string {
  const labels: Record<TrustLevel, string> = {
    unverified: 'Unverified',
    basic: 'Basic',
    verified: 'Verified',
    trusted: 'Trusted',
    elite: 'Elite',
  }
  return labels[level]
}

export function getTrustLevelColor(level: TrustLevel): string {
  const colors: Record<TrustLevel, string> = {
    unverified: 'text-zinc-400 bg-zinc-800',
    basic: 'text-blue-400 bg-blue-500/10',
    verified: 'text-green-400 bg-green-500/10',
    trusted: 'text-violet-400 bg-violet-500/10',
    elite: 'text-amber-400 bg-amber-500/10',
  }
  return colors[level]
}

export function getNextTrustLevel(currentLevel: TrustLevel): TrustLevel | null {
  const levels: TrustLevel[] = ['unverified', 'basic', 'verified', 'trusted', 'elite']
  const currentIndex = levels.indexOf(currentLevel)
  if (currentIndex < levels.length - 1) {
    return levels[currentIndex + 1]
  }
  return null
}

export function getPointsToNextLevel(currentScore: number, currentLevel: TrustLevel): number | null {
  const nextLevel = getNextTrustLevel(currentLevel)
  if (!nextLevel) return null
  return TRUST_LEVEL_THRESHOLDS[nextLevel] - currentScore
}

export interface TrustBreakdown {
  category: string
  points: number
  achieved: boolean
  description: string
}

export function getTrustBreakdown(input: TrustScoreInput): TrustBreakdown[] {
  return [
    {
      category: 'Email Verified',
      points: TRUST_POINTS.email_verified,
      achieved: input.emailVerified,
      description: 'Verify your email address',
    },
    {
      category: 'Complete Profile',
      points: TRUST_POINTS.profile_complete,
      achieved: input.profileComplete,
      description: 'Fill out your profile information',
    },
    {
      category: 'GitHub Connected',
      points: TRUST_POINTS.github_connected,
      achieved: input.githubConnected,
      description: 'Connect your GitHub account',
    },
    {
      category: 'Google Connected',
      points: TRUST_POINTS.google_connected,
      achieved: input.googleConnected,
      description: 'Connect your Google account',
    },
    {
      category: 'Phone Verified',
      points: TRUST_POINTS.phone_verified,
      achieved: input.phoneVerified,
      description: 'Verify your phone number',
    },
    {
      category: 'ID Verified',
      points: TRUST_POINTS.id_verified,
      achieved: input.idVerified,
      description: 'Complete ID verification',
    },
    {
      category: 'First Listing',
      points: TRUST_POINTS.first_listing,
      achieved: input.hasListings,
      description: 'Create your first listing',
    },
    {
      category: '5+ Sales',
      points: TRUST_POINTS.five_sales,
      achieved: input.successfulSales >= 5,
      description: 'Complete 5 successful sales',
    },
    {
      category: '10+ Sales',
      points: TRUST_POINTS.ten_sales,
      achieved: input.successfulSales >= 10,
      description: 'Complete 10 successful sales',
    },
    {
      category: '1 Year Member',
      points: TRUST_POINTS.one_year,
      achieved: input.accountAgeMonths >= 12,
      description: 'Be a member for 1 year',
    },
    {
      category: '2 Years Member',
      points: TRUST_POINTS.two_years,
      achieved: input.accountAgeMonths >= 24,
      description: 'Be a member for 2 years',
    },
  ]
}
