import { supabase } from '@/lib/supabase'
import type { CofounderRequest, CofounderRequestStatus } from '@/types'

export async function getCofounderRequest(userId: string): Promise<CofounderRequest | null> {
  const { data, error } = await supabase
    .from('cofounder_requests')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching cofounder request:', error)
    return null
  }

  return data
}

export async function createCofounderRequest(
  userId: string,
  message: string
): Promise<CofounderRequest | null> {
  const { data, error } = await supabase
    .from('cofounder_requests')
    .insert({
      user_id: userId,
      message,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating cofounder request:', error)
    return null
  }

  return data
}

export async function updateCofounderRequest(
  requestId: string,
  updates: { message?: string }
): Promise<CofounderRequest | null> {
  const { data, error } = await supabase
    .from('cofounder_requests')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) {
    console.error('Error updating cofounder request:', error)
    return null
  }

  return data
}

export async function getAllCofounderRequests(): Promise<CofounderRequest[]> {
  const { data, error } = await supabase
    .from('cofounder_requests')
    .select(`
      *,
      user:users(id, email, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all cofounder requests:', error)
    return []
  }

  return data || []
}

export async function updateCofounderRequestStatus(
  requestId: string,
  status: CofounderRequestStatus,
  adminNotes?: string
): Promise<CofounderRequest | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('cofounder_requests')
    .update({
      status,
      admin_notes: adminNotes,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) {
    console.error('Error updating cofounder request status:', error)
    return null
  }

  return data
}

export async function canRequestCofounder(userId: string): Promise<boolean> {
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
