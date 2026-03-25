import { supabase } from '@/lib/supabase'
import type { Prospect, ProspectStatus, ProspectSource, User } from '@/types'

export interface ProspectWithDetails extends Prospect {
  user: User
  listing: { id: string; title: string; price: number }
  prospect_score: number
}

export interface ProspectStats {
  total: number
  interested: number
  contacted: number
  converted: number
  newThisWeek: number
}

export async function expressInterest(
  listingId: string,
  source: ProspectSource,
  message?: string
): Promise<{ success: boolean; prospect?: Prospect; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('seller_id')
    .eq('id', listingId)
    .single()

  if (listingError || !listing) {
    return { success: false, error: 'Listing not found' }
  }

  if (listing.seller_id === user.id) {
    return { success: false, error: 'Cannot express interest in your own listing' }
  }

  const { data: existing } = await supabase
    .from('prospects')
    .select('id')
    .eq('listing_id', listingId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('prospects')
      .update({ 
        updated_at: new Date().toISOString(),
        message: message || undefined 
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError) {
      return { success: false, error: 'Failed to update interest' }
    }

    return { success: true, prospect: updated }
  }

  const { data: prospect, error } = await supabase
    .from('prospects')
    .insert({
      listing_id: listingId,
      user_id: user.id,
      seller_id: listing.seller_id,
      source,
      message,
      status: 'interested',
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: 'Failed to express interest' }
  }

  await createProspectNotification(listing.seller_id, prospect.id, listingId)

  return { success: true, prospect }
}

export async function getProspectsForSeller(): Promise<ProspectWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data, error } = await supabase
    .from('prospects')
    .select(`
      *,
      user:users!prospects_user_id_fkey(
        id, email, display_name, avatar_url, created_at,
        bio, website, linkedin_url, twitter_url, instagram_url,
        budget_range, investment_timeline, trust_score, trust_level,
        phone_verified, id_verified, profile_complete
      ),
      listing:listings!prospects_listing_id_fkey(id, title, price)
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(p => ({
    ...p,
    prospect_score: calculateProspectScoreClient(p.user),
  })) as ProspectWithDetails[]
}

export async function getProspectsForListing(listingId: string): Promise<ProspectWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data, error } = await supabase
    .from('prospects')
    .select(`
      *,
      user:users!prospects_user_id_fkey(
        id, email, display_name, avatar_url, created_at,
        bio, website, linkedin_url, twitter_url, instagram_url,
        budget_range, investment_timeline, trust_score, trust_level,
        phone_verified, id_verified, profile_complete
      ),
      listing:listings!prospects_listing_id_fkey(id, title, price)
    `)
    .eq('listing_id', listingId)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(p => ({
    ...p,
    prospect_score: calculateProspectScoreClient(p.user),
  })) as ProspectWithDetails[]
}

export async function getMyInterests(): Promise<ProspectWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data, error } = await supabase
    .from('prospects')
    .select(`
      *,
      user:users!prospects_user_id_fkey(id, email, display_name, avatar_url),
      listing:listings!prospects_listing_id_fkey(id, title, price)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data as ProspectWithDetails[]
}

export async function updateProspectStatus(
  prospectId: string,
  status: ProspectStatus
): Promise<boolean> {
  const { error } = await supabase
    .from('prospects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', prospectId)

  return !error
}

export async function markProspectViewed(prospectId: string): Promise<boolean> {
  const { error } = await supabase
    .from('prospects')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', prospectId)
    .is('viewed_at', null)

  return !error
}

export async function getProspectStats(): Promise<ProspectStats> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { total: 0, interested: 0, contacted: 0, converted: 0, newThisWeek: 0 }
  }

  const { data: prospects } = await supabase
    .from('prospects')
    .select('status, created_at')
    .eq('seller_id', user.id)

  if (!prospects) {
    return { total: 0, interested: 0, contacted: 0, converted: 0, newThisWeek: 0 }
  }

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return {
    total: prospects.length,
    interested: prospects.filter(p => p.status === 'interested').length,
    contacted: prospects.filter(p => p.status === 'contacted').length,
    converted: prospects.filter(p => p.status === 'converted').length,
    newThisWeek: prospects.filter(p => new Date(p.created_at) > oneWeekAgo).length,
  }
}

export function calculateProspectScoreClient(user: User | null): number {
  if (!user) return 0

  let score = 0

  if (user.bio) score += 8
  if (user.avatar_url) score += 6
  if (user.display_name) score += 6

  if (user.phone_verified) score += 15
  if (user.id_verified) score += 20

  if (user.budget_range) score += 10

  if (user.linkedin_url) score += 4
  if (user.twitter_url) score += 3
  if (user.website) score += 3

  const accountAge = user.created_at 
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0
  score += Math.min(10, accountAge)

  return Math.min(100, score)
}

export function getScoreLevel(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 85) return 'hot'
  if (score >= 50) return 'warm'
  return 'cold'
}

async function createProspectNotification(
  sellerId: string,
  prospectId: string,
  listingId: string
): Promise<void> {
  const { data: listing } = await supabase
    .from('listings')
    .select('title')
    .eq('id', listingId)
    .single()

  await supabase.from('notifications').insert({
    user_id: sellerId,
    type: 'new_prospect',
    title: 'New Interest',
    message: `Someone expressed interest in "${listing?.title || 'your listing'}"`,
    data: { prospect_id: prospectId, listing_id: listingId },
  })
}

export async function hasExpressedInterest(listingId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data } = await supabase
    .from('prospects')
    .select('id')
    .eq('listing_id', listingId)
    .eq('user_id', user.id)
    .single()

  return !!data
}
