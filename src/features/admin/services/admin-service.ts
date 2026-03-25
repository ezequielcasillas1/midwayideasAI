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

async function logAdminActivity(
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
