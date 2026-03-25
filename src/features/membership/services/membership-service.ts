import { supabase } from '@/lib/supabase'
import type { Membership, MembershipTier } from '../types'
import { TIER_CONFIG, TIER_ORDER } from '@/lib/membership-config'

export async function getMembership(userId: string): Promise<Membership | null> {
  const { data, error } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

export async function createMembership(userId: string): Promise<Membership> {
  const { data, error } = await supabase
    .from('memberships')
    .insert({
      user_id: userId,
      tier: 'citizen' as MembershipTier,
      points: 0,
      is_verified: false,
      beta_earning_rate: true,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function upgradeTier(userId: string, tier: MembershipTier): Promise<Membership> {
  const { data, error } = await supabase
    .from('memberships')
    .update({ tier })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function downgradeTier(userId: string): Promise<Membership> {
  const { data, error } = await supabase
    .from('memberships')
    .update({ tier: 'citizen' as MembershipTier })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function toggleBetaEarningRate(userId: string, enabled: boolean): Promise<Membership> {
  const { data, error } = await supabase
    .from('memberships')
    .update({ beta_earning_rate: enabled })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function setVerified(userId: string, isVerified: boolean): Promise<Membership> {
  const { data, error } = await supabase
    .from('memberships')
    .update({ is_verified: isVerified })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export function checkTierAccess(userTier: MembershipTier, requiredTier: MembershipTier): boolean {
  const userIndex = TIER_ORDER.indexOf(userTier)
  const requiredIndex = TIER_ORDER.indexOf(requiredTier)
  return userIndex >= requiredIndex
}

export function getTierConfig(tier: MembershipTier) {
  return TIER_CONFIG[tier]
}
