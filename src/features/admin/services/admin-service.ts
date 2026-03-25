import { supabase } from '@/lib/supabase'
import type { User, CofounderRequest, CommunityAnnouncement } from '@/types'

export interface AdminStats {
  totalUsers: number
  totalListings: number
  totalSovereigns: number
  totalRevenue: number
  pendingCofounderRequests: number
}

export interface SovereignUser {
  user: User
  membership: {
    points: number
    created_at: string
  }
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (error || !data) return false
  return data.is_admin === true
}

export async function getAdminStats(): Promise<AdminStats> {
  const [usersResult, listingsResult, sovereignsResult, pendingResult] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('listings').select('id', { count: 'exact', head: true }),
    supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('tier', 'sovereign'),
    supabase.from('cofounder_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  ])

  return {
    totalUsers: usersResult.count || 0,
    totalListings: listingsResult.count || 0,
    totalSovereigns: sovereignsResult.count || 0,
    totalRevenue: 0,
    pendingCofounderRequests: pendingResult.count || 0
  }
}

export async function getAllSovereignUsers(): Promise<SovereignUser[]> {
  const { data, error } = await supabase
    .from('memberships')
    .select(`
      points,
      created_at,
      user:users(id, email, display_name, avatar_url, created_at)
    `)
    .eq('tier', 'sovereign')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sovereign users:', error)
    return []
  }

  return (data || []).map(m => ({
    user: m.user as unknown as User,
    membership: {
      points: m.points,
      created_at: m.created_at
    }
  }))
}

export async function getAllCofounderRequests(): Promise<(CofounderRequest & { user: User })[]> {
  const { data, error } = await supabase
    .from('cofounder_requests')
    .select(`
      *,
      user:users(id, email, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching cofounder requests:', error)
    return []
  }

  return data || []
}

export async function updateCofounderRequestStatus(
  requestId: string,
  status: 'pending' | 'in_discussion' | 'approved' | 'rejected',
  adminNotes?: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { error } = await supabase
    .from('cofounder_requests')
    .update({
      status,
      admin_notes: adminNotes,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (error) {
    console.error('Error updating request status:', error)
    return false
  }

  await logAdminActivity('update_cofounder_status', 'cofounder_request', requestId, { status, adminNotes })
  return true
}

export async function getAllAnnouncements(): Promise<CommunityAnnouncement[]> {
  const { data, error } = await supabase
    .from('community_announcements')
    .select(`
      *,
      author:users(id, email, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching announcements:', error)
    return []
  }

  return data || []
}

export async function createAnnouncement(
  title: string,
  content: string,
  isPinned: boolean = false,
  publish: boolean = false
): Promise<CommunityAnnouncement | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('community_announcements')
    .insert({
      title,
      content,
      author_id: user.id,
      is_pinned: isPinned,
      published_at: publish ? new Date().toISOString() : null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating announcement:', error)
    return null
  }

  await logAdminActivity('create_announcement', 'announcement', data.id, { title })
  return data
}

export async function updateAnnouncement(
  id: string,
  updates: {
    title?: string
    content?: string
    is_pinned?: boolean
    published_at?: string | null
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('community_announcements')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating announcement:', error)
    return false
  }

  await logAdminActivity('update_announcement', 'announcement', id, updates)
  return true
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('community_announcements')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting announcement:', error)
    return false
  }

  await logAdminActivity('delete_announcement', 'announcement', id, {})
  return true
}

export async function logAdminActivity(
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('admin_activity_log')
    .insert({
      admin_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      details
    })
}

export interface UserDetails {
  user: User
  membership: {
    id: string
    tier: string
    points: number
    is_verified: boolean
    beta_earning_rate: boolean
    created_at: string
  } | null
  listings: {
    id: string
    title: string
    status: string
    is_featured: boolean
    created_at: string
  }[]
  pointTransactions: {
    id: string
    amount: number
    reason: string
    created_at: string
  }[]
  cofounderRequest: CofounderRequest | null
}

export async function getUserDetails(userId: string): Promise<UserDetails | null> {
  const [userResult, membershipResult, listingsResult, transactionsResult, cofounderResult] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('memberships').select('*').eq('user_id', userId).single(),
    supabase.from('listings').select('id, title, status, is_featured, created_at').eq('seller_id', userId).order('created_at', { ascending: false }),
    supabase.from('point_transactions').select('id, amount, reason, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    supabase.from('cofounder_requests').select('*').eq('user_id', userId).single()
  ])

  if (userResult.error || !userResult.data) return null

  return {
    user: userResult.data,
    membership: membershipResult.data || null,
    listings: listingsResult.data || [],
    pointTransactions: transactionsResult.data || [],
    cofounderRequest: cofounderResult.data || null
  }
}

export async function updateUserDisplayName(userId: string, displayName: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ display_name: displayName })
    .eq('id', userId)

  if (error) {
    console.error('Error updating display name:', error)
    return false
  }

  await logAdminActivity('update_user_display_name', 'user', userId, { displayName })
  return true
}

export async function updateUserMembershipTier(userId: string, tier: string): Promise<boolean> {
  const { error } = await supabase
    .from('memberships')
    .update({ tier, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating membership tier:', error)
    return false
  }

  await logAdminActivity('update_user_tier', 'user', userId, { tier })
  return true
}

export async function adjustUserPoints(userId: string, amount: number, reason: string): Promise<boolean> {
  const { data: membership, error: fetchError } = await supabase
    .from('memberships')
    .select('points')
    .eq('user_id', userId)
    .single()

  if (fetchError || !membership) return false

  const newPoints = Math.max(0, membership.points + amount)

  const { error: updateError } = await supabase
    .from('memberships')
    .update({ points: newPoints, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (updateError) return false

  await supabase.from('point_transactions').insert({
    user_id: userId,
    amount,
    reason: `[Admin] ${reason}`,
    multiplier_applied: 1.0
  })

  await logAdminActivity('adjust_user_points', 'user', userId, { amount, reason, newPoints })
  return true
}

export async function getAllListings(): Promise<{
  id: string
  title: string
  status: string
  category: string
  price: number
  is_featured: boolean
  seller_id: string
  seller: User | null
  created_at: string
}[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id, title, status, category, price, is_featured, seller_id, created_at,
      seller:users(id, email, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching listings:', error)
    return []
  }

  return (data || []).map(l => ({
    ...l,
    seller: l.seller as unknown as User
  }))
}

export async function toggleListingFeatured(listingId: string, isFeatured: boolean): Promise<boolean> {
  const featuredUntil = isFeatured 
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { error } = await supabase
    .from('listings')
    .update({ is_featured: isFeatured, featured_until: featuredUntil, updated_at: new Date().toISOString() })
    .eq('id', listingId)

  if (error) return false

  await logAdminActivity('toggle_listing_featured', 'listing', listingId, { isFeatured })
  return true
}

export async function removeListing(listingId: string, reason: string): Promise<boolean> {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .eq('id', listingId)

  if (error) return false

  await logAdminActivity('remove_listing', 'listing', listingId, { reason })
  return true
}

export async function getActivityLog(limit: number = 50): Promise<{
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string | null
  details: Record<string, unknown>
  created_at: string
  admin?: User
}[]> {
  const { data, error } = await supabase
    .from('admin_activity_log')
    .select(`
      *,
      admin:users(id, email, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching activity log:', error)
    return []
  }

  return (data || []).map(a => ({
    ...a,
    admin: a.admin as unknown as User
  }))
}

export async function updateCofounderNotes(requestId: string, notes: string): Promise<boolean> {
  const { error } = await supabase
    .from('cofounder_requests')
    .update({ admin_notes: notes, updated_at: new Date().toISOString() })
    .eq('id', requestId)

  if (error) return false

  await logAdminActivity('update_cofounder_notes', 'cofounder_request', requestId, { notes })
  return true
}

export interface UserWithMembership {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  is_banned: boolean
  ban_reason: string | null
  membership: {
    tier: string
    points: number
  } | null
  listings_count: number
}

export async function getAllUsers(): Promise<UserWithMembership[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, email, display_name, avatar_url, created_at, is_banned, ban_reason,
      memberships(tier, points)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  const usersWithListings = await Promise.all(
    (data || []).map(async (user) => {
      const { count } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', user.id)

      return {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        is_banned: user.is_banned || false,
        ban_reason: user.ban_reason || null,
        membership: user.memberships?.[0] || null,
        listings_count: count || 0
      }
    })
  )

  return usersWithListings
}

export async function banUser(userId: string, reason: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ 
      is_banned: true, 
      ban_reason: reason,
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId)

  if (error) {
    console.error('Error banning user:', error)
    return false
  }

  await logAdminActivity('ban_user', 'user', userId, { reason })
  return true
}

export async function unbanUser(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ 
      is_banned: false, 
      ban_reason: null,
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId)

  if (error) {
    console.error('Error unbanning user:', error)
    return false
  }

  await logAdminActivity('unban_user', 'user', userId, {})
  return true
}

export async function banListing(listingId: string, reason: string): Promise<boolean> {
  const { error } = await supabase
    .from('listings')
    .update({ 
      status: 'banned',
      ban_reason: reason,
      updated_at: new Date().toISOString() 
    })
    .eq('id', listingId)

  if (error) {
    console.error('Error banning listing:', error)
    return false
  }

  await logAdminActivity('ban_listing', 'listing', listingId, { reason })
  return true
}

export async function unbanListing(listingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('listings')
    .update({ 
      status: 'active',
      ban_reason: null,
      updated_at: new Date().toISOString() 
    })
    .eq('id', listingId)

  if (error) {
    console.error('Error unbanning listing:', error)
    return false
  }

  await logAdminActivity('unban_listing', 'listing', listingId, {})
  return true
}

export interface ModerationLog {
  id: string
  content_type: string
  content_id: string | null
  user_id: string | null
  tisane_flagged: boolean
  tisane_categories: Record<string, number> | null
  openai_flagged: boolean
  openai_categories: Record<string, number> | null
  custom_flagged: boolean
  custom_reasons: string[] | null
  approved: boolean
  severity: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  user?: User
}

export interface ModerationStats {
  totalChecks: number
  flaggedCount: number
  approvedCount: number
  tisaneFlagCount: number
  openAiFlagCount: number
  customFlagCount: number
  bySeverity: { low: number; medium: number; high: number }
  byContentType: { listing: number; comment: number; message: number }
  recentFlags: ModerationLog[]
}

export async function getModerationStats(days: number = 30): Promise<ModerationStats> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: logs, error } = await supabase
    .from('moderation_logs')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching moderation stats:', error)
    return {
      totalChecks: 0,
      flaggedCount: 0,
      approvedCount: 0,
      tisaneFlagCount: 0,
      openAiFlagCount: 0,
      customFlagCount: 0,
      bySeverity: { low: 0, medium: 0, high: 0 },
      byContentType: { listing: 0, comment: 0, message: 0 },
      recentFlags: [],
    }
  }

  const allLogs = logs || []
  const flaggedLogs = allLogs.filter(l => !l.approved || l.tisane_flagged || l.openai_flagged || l.custom_flagged)

  return {
    totalChecks: allLogs.length,
    flaggedCount: flaggedLogs.length,
    approvedCount: allLogs.filter(l => l.approved).length,
    tisaneFlagCount: allLogs.filter(l => l.tisane_flagged).length,
    openAiFlagCount: allLogs.filter(l => l.openai_flagged).length,
    customFlagCount: allLogs.filter(l => l.custom_flagged).length,
    bySeverity: {
      low: allLogs.filter(l => l.severity === 'low').length,
      medium: allLogs.filter(l => l.severity === 'medium').length,
      high: allLogs.filter(l => l.severity === 'high').length,
    },
    byContentType: {
      listing: allLogs.filter(l => l.content_type === 'listing').length,
      comment: allLogs.filter(l => l.content_type === 'comment').length,
      message: allLogs.filter(l => l.content_type === 'message').length,
    },
    recentFlags: flaggedLogs.slice(0, 10),
  }
}

export async function getModerationLogs(
  filters?: {
    contentType?: string
    approved?: boolean
    severity?: string
    startDate?: string
    endDate?: string
  },
  limit: number = 50,
  offset: number = 0
): Promise<{ logs: ModerationLog[]; total: number }> {
  let query = supabase
    .from('moderation_logs')
    .select(`
      *,
      user:users(id, email, display_name, avatar_url)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters?.contentType) {
    query = query.eq('content_type', filters.contentType)
  }

  if (filters?.approved !== undefined) {
    query = query.eq('approved', filters.approved)
  }

  if (filters?.severity) {
    query = query.eq('severity', filters.severity)
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching moderation logs:', error)
    return { logs: [], total: 0 }
  }

  return {
    logs: (data || []).map(l => ({
      ...l,
      user: l.user as unknown as User,
    })),
    total: count || 0,
  }
}

export async function reviewModerationLog(
  logId: string,
  approved: boolean
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('moderation_logs')
    .update({
      approved,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', logId)

  if (error) {
    console.error('Error reviewing moderation log:', error)
    return false
  }

  await logAdminActivity('review_moderation', 'moderation_log', logId, { approved })
  return true
}
