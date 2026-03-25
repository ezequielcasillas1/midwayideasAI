import { supabase } from '@/lib/supabase'
import type { CommunityAnnouncement, User } from '@/types'

export interface SovereignMember {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  joined_at: string
}

export async function getPublishedAnnouncements(): Promise<CommunityAnnouncement[]> {
  const { data, error } = await supabase
    .from('community_announcements')
    .select(`
      *,
      author:users(id, email, display_name, avatar_url)
    `)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching announcements:', error)
    return []
  }

  return data || []
}

export async function getSovereignMembers(): Promise<SovereignMember[]> {
  const { data, error } = await supabase
    .from('memberships')
    .select(`
      user_id,
      created_at,
      user:users(id, email, display_name, avatar_url)
    `)
    .eq('tier', 'sovereign')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sovereign members:', error)
    return []
  }

  return (data || []).map(m => ({
    id: (m.user as User).id,
    email: (m.user as User).email,
    display_name: (m.user as User).display_name,
    avatar_url: (m.user as User).avatar_url,
    joined_at: m.created_at
  }))
}

export async function markAnnouncementAsRead(
  announcementId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('announcement_reads')
    .upsert({
      announcement_id: announcementId,
      user_id: userId,
      read_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error marking announcement as read:', error)
  }
}

export async function getUnreadAnnouncementCount(userId: string): Promise<number> {
  const { data: announcements } = await supabase
    .from('community_announcements')
    .select('id')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())

  if (!announcements || announcements.length === 0) return 0

  const { data: reads } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('user_id', userId)

  const readIds = new Set(reads?.map(r => r.announcement_id) || [])
  return announcements.filter(a => !readIds.has(a.id)).length
}

export async function canAccessCommunity(userId: string): Promise<boolean> {
  const { bypassTierCheck } = await import('@/lib/admin-config')
  if (bypassTierCheck()) return true

  const { data, error } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', userId)
    .single()

  if (error || !data) return false

  return data.tier === 'sovereign'
}

export async function createAnnouncement(
  title: string,
  content: string,
  authorId: string,
  publish: boolean = false,
  isPinned: boolean = false
): Promise<CommunityAnnouncement | null> {
  const { data, error } = await supabase
    .from('community_announcements')
    .insert({
      title,
      content,
      author_id: authorId,
      is_pinned: isPinned,
      published_at: publish ? new Date().toISOString() : null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating announcement:', error)
    return null
  }

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
): Promise<CommunityAnnouncement | null> {
  const { data, error } = await supabase
    .from('community_announcements')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating announcement:', error)
    return null
  }

  return data
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

  return true
}
