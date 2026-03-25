export type Category = 'webapp' | 'website' | 'extension' | 'desktop' | 'mobile' | 'game' | 'api' | 'os' | 'other'
export type ListingStatus = 'active' | 'sold' | 'draft'
export type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'completion'
export type MembershipTier = 'citizen' | 'knight' | 'baron' | 'duke' | 'sovereign'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete'

export interface User {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Membership {
  id: string
  user_id: string
  tier: MembershipTier
  points: number
  is_verified: boolean
  beta_earning_rate: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  tier: MembershipTier
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
}

export interface PointTransaction {
  id: string
  user_id: string
  amount: number
  reason: string
  multiplier_applied: number
  created_at: string
}

export interface SovereignBan {
  id: string
  user_id: string
  ban_count: number
  cofounder_id: string | null
  refund_amount: number | null
  created_at: string
}

export type FlagStatus = 'pending' | 'confirmed' | 'dismissed'

export interface ListingReview {
  id: string
  listing_id: string
  reviewer_id: string
  seller_id: string
  stars: number
  comment: string | null
  points_deducted: boolean
  created_at: string
}

export interface UserFlag {
  id: string
  user_id: string
  flagger_id: string
  reason: string
  status: FlagStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Listing {
  id: string
  title: string
  description: string
  category: Category
  tech_stack: string[]
  price: number
  completion_percent: number
  repo_url: string | null
  demo_url: string | null
  images: string[]
  status: ListingStatus
  seller_id: string
  seller?: User
  is_featured: boolean
  featured_until: string | null
  created_at: string
  updated_at: string
}

export interface ListingFilters {
  category?: Category
  minPrice?: number
  maxPrice?: number
  minCompletion?: number
  maxCompletion?: number
  search?: string
  sort?: SortOption
  page?: number
}

export type CofounderRequestStatus = 'pending' | 'in_discussion' | 'approved' | 'rejected'

export interface ListingView {
  id: string
  listing_id: string
  viewer_id: string | null
  viewer_ip: string | null
  referrer: string | null
  created_at: string
}

export interface ListingStatsDaily {
  id: string
  listing_id: string
  date: string
  view_count: number
  unique_viewers: number
  created_at: string
}

export interface UserAnalytics {
  id: string
  user_id: string
  total_views: number
  total_listings: number
  total_points_earned: number
  last_calculated_at: string
}

export interface CofounderRequest {
  id: string
  user_id: string
  status: CofounderRequestStatus
  message: string | null
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  user?: User
}

export interface CommunityAnnouncement {
  id: string
  title: string
  content: string
  author_id: string
  is_pinned: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  author?: User
}

export interface AnnouncementRead {
  id: string
  announcement_id: string
  user_id: string
  read_at: string
}

export interface AdminActivityLog {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      listings: {
        Row: Listing
        Insert: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'seller'>
        Update: Partial<Omit<Listing, 'id' | 'created_at' | 'seller_id' | 'seller'>>
      }
      memberships: {
        Row: Membership
        Insert: Omit<Membership, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Membership, 'id' | 'user_id' | 'created_at'>>
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'created_at'>
        Update: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at'>>
      }
      point_transactions: {
        Row: PointTransaction
        Insert: Omit<PointTransaction, 'id' | 'created_at'>
        Update: never
      }
      sovereign_bans: {
        Row: SovereignBan
        Insert: Omit<SovereignBan, 'id' | 'created_at'>
        Update: Partial<Omit<SovereignBan, 'id' | 'user_id' | 'created_at'>>
      }
      listing_reviews: {
        Row: ListingReview
        Insert: Omit<ListingReview, 'id' | 'created_at'>
        Update: never
      }
      user_flags: {
        Row: UserFlag
        Insert: Omit<UserFlag, 'id' | 'created_at' | 'reviewed_at'>
        Update: Partial<Pick<UserFlag, 'status' | 'reviewed_by' | 'reviewed_at'>>
      }
    }
  }
}
