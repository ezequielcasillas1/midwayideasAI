import { supabase } from '@/lib/supabase'
import type { Listing } from '@/types'

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
