import { supabase } from '@/lib/supabase'
import type { Listing } from '@/types'
import { moderateListingContent, type ModerationCheckResult } from '@/lib/moderation'

export interface ListingModerationResult {
  canProceed: boolean
  moderation: ModerationCheckResult | null
  error?: string
}

export async function checkListingContent(
  title: string,
  description: string,
  price?: number,
  repoUrl?: string,
  demoUrl?: string
): Promise<ListingModerationResult> {
  const { data: { session } } = await supabase.auth.getSession()
  const urls = [repoUrl, demoUrl].filter(Boolean) as string[]

  try {
    const result = await moderateListingContent(
      title,
      description,
      price,
      urls,
      session?.access_token
    )

    if (!result.approved) {
      return {
        canProceed: false,
        moderation: result,
        error: result.flags.length > 0 
          ? `Content flagged: ${result.flags.slice(0, 3).join(', ')}`
          : 'Content did not pass moderation',
      }
    }

    if (result.requiresReview) {
      return {
        canProceed: true,
        moderation: result,
        error: 'Your listing will be reviewed before publishing',
      }
    }

    return {
      canProceed: true,
      moderation: result,
    }
  } catch (error) {
    console.error('Listing moderation check failed:', error)
    return {
      canProceed: true,
      moderation: null,
    }
  }
}

export async function toggleFeaturedListing(
  listingId: string,
  isFeatured: boolean,
  featuredDurationDays: number = 7
): Promise<Listing | null> {
  const featuredUntil = isFeatured 
    ? new Date(Date.now() + featuredDurationDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { data, error } = await supabase
    .from('listings')
    .update({
      is_featured: isFeatured,
      featured_until: featuredUntil,
      updated_at: new Date().toISOString()
    })
    .eq('id', listingId)
    .select()
    .single()

  if (error) {
    console.error('Error toggling featured:', error)
    return null
  }

  return data
}

export async function getFeaturedListings(limit: number = 6): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*, seller:users(*)')
    .eq('status', 'active')
    .eq('is_featured', true)
    .or(`featured_until.is.null,featured_until.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured listings:', error)
    return []
  }

  return data || []
}

export async function canUserFeatureListing(userId: string): Promise<boolean> {
  const { bypassTierCheck } = await import('@/lib/admin-config')
  if (bypassTierCheck()) return true

  const { data, error } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', userId)
    .single()

  if (error || !data) return false

  return ['baron', 'duke', 'sovereign'].includes(data.tier)
}
