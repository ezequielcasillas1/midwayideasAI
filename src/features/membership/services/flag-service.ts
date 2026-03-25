import { supabase } from '@/lib/supabase'
import type { UserFlag, FlagStatus } from '@/types'

export interface FlagResult {
  flag: UserFlag
}

export interface BanResult {
  success: boolean
  userId: string
  banCount: number
}

export async function flagUser(
  userId: string,
  flaggerId: string,
  reason: string
): Promise<FlagResult> {
  if (userId === flaggerId) {
    throw new Error('Cannot flag yourself')
  }

  const { data: existing } = await supabase
    .from('user_flags')
    .select('id')
    .eq('user_id', userId)
    .eq('flagger_id', flaggerId)
    .eq('status', 'pending')
    .single()

  if (existing) {
    throw new Error('You have already flagged this user')
  }

  const { data: flag, error } = await supabase
    .from('user_flags')
    .insert({
      user_id: userId,
      flagger_id: flaggerId,
      reason,
      status: 'pending' as FlagStatus,
      reviewed_by: null,
    })
    .select()
    .single()

  if (error) throw error

  return { flag }
}

export async function getPendingFlags(): Promise<UserFlag[]> {
  const { data, error } = await supabase
    .from('user_flags')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getFlagsForUser(userId: string): Promise<UserFlag[]> {
  const { data, error } = await supabase
    .from('user_flags')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function reviewFlag(
  flagId: string,
  reviewerId: string,
  action: 'confirm' | 'dismiss'
): Promise<UserFlag> {
  const newStatus: FlagStatus = action === 'confirm' ? 'confirmed' : 'dismissed'

  const { data: flag, error } = await supabase
    .from('user_flags')
    .update({
      status: newStatus,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', flagId)
    .select()
    .single()

  if (error) throw error

  if (action === 'confirm' && flag) {
    await banUser(flag.user_id, reviewerId)
  }

  return flag
}

export async function banUser(userId: string, cofounderId: string | null = null): Promise<BanResult> {
  const { data: existing } = await supabase
    .from('sovereign_bans')
    .select('ban_count')
    .eq('user_id', userId)
    .single()

  const newBanCount = (existing?.ban_count || 0) + 1

  if (existing) {
    const { error } = await supabase
      .from('sovereign_bans')
      .update({ ban_count: newBanCount, cofounder_id: cofounderId })
      .eq('user_id', userId)

    if (error) throw error
  } else {
    const { error } = await supabase
      .from('sovereign_bans')
      .insert({
        user_id: userId,
        ban_count: 1,
        cofounder_id: cofounderId,
        refund_amount: null,
      })

    if (error) throw error
  }

  const { error: membershipError } = await supabase
    .from('memberships')
    .update({ points: 0 })
    .eq('user_id', userId)

  if (membershipError) throw membershipError

  return {
    success: true,
    userId,
    banCount: newBanCount,
  }
}

export async function getUserBanStatus(userId: string): Promise<{ isBanned: boolean; banCount: number }> {
  const { data } = await supabase
    .from('sovereign_bans')
    .select('ban_count')
    .eq('user_id', userId)
    .single()

  return {
    isBanned: (data?.ban_count || 0) > 0,
    banCount: data?.ban_count || 0,
  }
}
