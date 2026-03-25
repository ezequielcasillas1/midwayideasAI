export type { 
  MembershipTier, 
  SubscriptionStatus, 
  Membership, 
  Subscription, 
  PointTransaction, 
  SovereignBan 
} from '@/types'

export interface MembershipWithUser extends Membership {
  user?: {
    id: string
    email: string
    display_name: string | null
  }
}

export interface PointsEarning {
  earnedPoints: number
  newTotal: number
  cappedAt: number | null
}

export interface CheckoutSession {
  sessionId: string
  url: string
}

export interface PortalSession {
  url: string
}
