import { supabase } from '@/lib/supabase'
import type { PointTransaction, MembershipTier } from '../types'
import type { PointsEarning } from '../types'
import { 
  getPointsCap, 
  getEarningRate, 
  calculatePoints as calculatePointsConfig 
} from '@/lib/membership-config'

export async function addPoints(
  userId: string,
  amount: number,
  reason: string,
  tier: MembershipTier,
  currentPoints: number,
  betaEnabled: boolean,
  isVerified: boolean = false
): Promise<PointsEarning> {
  const result = calculatePointsConfig(amount, tier, currentPoints, betaEnabled, isVerified)
  
  if (result.earnedPoints <= 0) {
    return result
  }

  const multiplier = getEarningRate(tier, betaEnabled, isVerified)

  const { error: txError } = await supabase
    .from('point_transactions')
    .insert({
      user_id: userId,
      amount: result.earnedPoints,
      reason,
      multiplier_applied: multiplier,
    })

  if (txError) throw txError

  const { error: updateError } = await supabase
    .from('memberships')
    .update({ points: result.newTotal })
    .eq('user_id', userId)

  if (updateError) throw updateError

  return result
}

export async function getPointsHistory(
  userId: string,
  limit: number = 50
): Promise<PointTransaction[]> {
  const { data, error } = await supabase
    .from('point_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getTotalPointsEarned(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('point_transactions')
    .select('amount')
    .eq('user_id', userId)

  if (error) throw error
  
  return (data || []).reduce((sum, tx) => sum + (tx.amount > 0 ? tx.amount : 0), 0)
}

export interface PointsDeduction {
  deductedPoints: number
  newTotal: number
  flooredAt: boolean
}

export async function deductPoints(
  userId: string,
  amount: number,
  reason: string,
  currentPoints: number
): Promise<PointsDeduction> {
  const actualDeduction = Math.min(amount, currentPoints)
  const newTotal = Math.max(0, currentPoints - amount)
  const flooredAt = currentPoints - amount < 0

  if (actualDeduction <= 0) {
    return { deductedPoints: 0, newTotal: currentPoints, flooredAt: false }
  }

  const { error: txError } = await supabase
    .from('point_transactions')
    .insert({
      user_id: userId,
      amount: -actualDeduction,
      reason,
      multiplier_applied: 1.0,
    })

  if (txError) throw txError

  const { error: updateError } = await supabase
    .from('memberships')
    .update({ points: newTotal })
    .eq('user_id', userId)

  if (updateError) throw updateError

  return { deductedPoints: actualDeduction, newTotal, flooredAt }
}

export { getPointsCap, getEarningRate }
