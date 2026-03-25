import type { MembershipTier } from '@/types'

export const EARNING_RATE_ENABLED = process.env.NEXT_PUBLIC_EARNING_RATE_ENABLED !== 'false'

export const NEGATIVE_REVIEW_PENALTY = 5
export const NEGATIVE_REVIEW_THRESHOLD = 2

export const CAPTCHA_BYPASS_COST = 3

export interface TierConfig {
  name: string
  price: number
  priceLabel: string
  interval: 'week' | 'month' | 'year' | 'lifetime' | null
  maxPoints: number
  earningRate: number
  stripePriceId: string | null
  features: string[]
  allFeatures: {
    included: string[]
    excluded: string[]
  }
}

export const TIER_CONFIG: Record<MembershipTier, TierConfig> = {
  citizen: {
    name: 'Citizen',
    price: 0,
    priceLabel: 'Free',
    interval: null,
    maxPoints: 1000,
    earningRate: 1.0,
    stripePriceId: null,
    features: [
      'Browse all listings',
      'Create up to 3 listings',
      'Progress to Sovereign status',
      '1x earning rate',
    ],
    allFeatures: {
      included: [
        'Browse all listings',
        'Create up to 3 listings',
        'Progress to Sovereign status',
        '1x earning rate',
        'Basic profile',
      ],
      excluded: [
        'Unlimited listings',
        'Priority support',
        'Featured listings',
        'Analytics dashboard',
        'Exclusive badge',
        'Co-founder rights',
        'Exclusive community',
      ],
    },
  },
  knight: {
    name: 'Knight',
    price: 399,
    priceLabel: '$3.99/week',
    interval: 'week',
    maxPoints: 1000,
    earningRate: 1.25,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_KNIGHT_PRICE_ID || null,
    features: [
      'Unlimited listings',
      '1.25x earning rate',
      'Knight badge',
      'Priority support',
    ],
    allFeatures: {
      included: [
        'Browse all listings',
        'Unlimited listings',
        '1.25x earning rate',
        'Knight badge',
        'Priority support',
        'Progress to Sovereign status',
      ],
      excluded: [
        'Featured listings',
        'Analytics dashboard',
        'Co-founder rights',
        'Exclusive community',
      ],
    },
  },
  baron: {
    name: 'Baron',
    price: 1199,
    priceLabel: '$11.99/month',
    interval: 'month',
    maxPoints: 1000,
    earningRate: 1.5,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BARON_PRICE_ID || null,
    features: [
      'All Knight features',
      '1.5x earning rate',
      'Baron badge',
      'Featured listings',
    ],
    allFeatures: {
      included: [
        'Browse all listings',
        'Unlimited listings',
        '1.5x earning rate',
        'Baron badge',
        'Priority support',
        'Featured listings',
        'Progress to Sovereign status',
      ],
      excluded: [
        'Analytics dashboard',
        'Co-founder rights',
        'Exclusive community',
      ],
    },
  },
  duke: {
    name: 'Duke',
    price: 5999,
    priceLabel: '$59.99/year',
    interval: 'year',
    maxPoints: 1000,
    earningRate: 2.0,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_DUKE_PRICE_ID || null,
    features: [
      'All Baron features',
      '2x earning rate',
      'Duke badge',
      'Analytics dashboard',
    ],
    allFeatures: {
      included: [
        'Browse all listings',
        'Unlimited listings',
        '2x earning rate',
        'Duke badge',
        'Priority support',
        'Featured listings',
        'Analytics dashboard',
        'Progress to Sovereign status',
      ],
      excluded: [
        'Co-founder rights',
        'Exclusive community',
      ],
    },
  },
  sovereign: {
    name: 'Sovereign',
    price: 100000,
    priceLabel: '$1,000 lifetime',
    interval: 'lifetime',
    maxPoints: 1000,
    earningRate: 3.0,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SOVEREIGN_PRICE_ID || null,
    features: [
      'All Duke features',
      '3x earning rate',
      'Sovereign badge',
      'Co-founder eligibility',
      'Exclusive community',
    ],
    allFeatures: {
      included: [
        'Browse all listings',
        'Unlimited listings',
        '3x earning rate',
        'Sovereign badge',
        'Priority support',
        'Featured listings',
        'Analytics dashboard',
        'Co-founder eligibility',
        'Exclusive community',
        'Lifetime access',
      ],
      excluded: [],
    },
  },
}

export function getPointsCap(tier: MembershipTier): number {
  return TIER_CONFIG[tier].maxPoints
}

export function getEarningRate(tier: MembershipTier, betaEnabled: boolean, isVerified: boolean = false): number {
  if (!EARNING_RATE_ENABLED || !betaEnabled) {
    return 1.0
  }
  
  let rate = TIER_CONFIG[tier].earningRate
  
  if (tier === 'citizen' && isVerified) {
    rate = 1.1
  }
  
  return rate
}

export function calculatePoints(
  basePoints: number,
  tier: MembershipTier,
  currentPoints: number,
  betaEnabled: boolean,
  isVerified: boolean = false
): { earnedPoints: number; newTotal: number; cappedAt: number | null } {
  const cap = getPointsCap(tier)
  const rate = getEarningRate(tier, betaEnabled, isVerified)
  
  const rawEarned = Math.floor(basePoints * rate)
  const potentialTotal = currentPoints + rawEarned
  
  if (potentialTotal > cap) {
    const actualEarned = cap - currentPoints
    return {
      earnedPoints: Math.max(0, actualEarned),
      newTotal: cap,
      cappedAt: cap,
    }
  }
  
  return {
    earnedPoints: rawEarned,
    newTotal: potentialTotal,
    cappedAt: null,
  }
}

export const TIER_ORDER: MembershipTier[] = ['citizen', 'knight', 'baron', 'duke', 'sovereign']

export function canUpgradeTo(currentTier: MembershipTier, targetTier: MembershipTier): boolean {
  const currentIndex = TIER_ORDER.indexOf(currentTier)
  const targetIndex = TIER_ORDER.indexOf(targetTier)
  return targetIndex > currentIndex
}
