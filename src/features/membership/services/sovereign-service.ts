import { supabase } from '@/lib/supabase'
import type { SovereignBan } from '../types'

const FIRST_BAN_REFUND = 100
const COFOUNDER_BAN_REFUND = 50

export async function getSovereignBan(userId: string): Promise<SovereignBan | null> {
  const { data, error } = await supabase
    .from('sovereign_bans')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

export async function banSovereign(
  userId: string,
  chooseCofounder: boolean,
  cofounderId?: string
): Promise<{ refundAmount: number | null; cofounderId: string | null }> {
  const existingBan = await getSovereignBan(userId)
  
  if (existingBan) {
    const newCount = existingBan.ban_count + 1
    let refundAmount: number | null = null

    if (existingBan.cofounder_id) {
      refundAmount = COFOUNDER_BAN_REFUND
    }

    await supabase
      .from('sovereign_bans')
      .update({
        ban_count: newCount,
        refund_amount: refundAmount,
      })
      .eq('user_id', userId)

    return { refundAmount, cofounderId: existingBan.cofounder_id }
  }

  let refundAmount: number | null = null
  let assignedCofounderId: string | null = null

  if (chooseCofounder && cofounderId) {
    assignedCofounderId = cofounderId
    refundAmount = null
  } else {
    refundAmount = FIRST_BAN_REFUND
  }

  await supabase
    .from('sovereign_bans')
    .insert({
      user_id: userId,
      ban_count: 1,
      cofounder_id: assignedCofounderId,
      refund_amount: refundAmount,
    })

  return { refundAmount, cofounderId: assignedCofounderId }
}

export async function assignCofounder(
  userId: string,
  cofounderId: string
): Promise<void> {
  const { error } = await supabase
    .from('sovereign_bans')
    .update({ cofounder_id: cofounderId, refund_amount: null })
    .eq('user_id', userId)

  if (error) throw error
}

export async function hasCofoundership(userId: string): Promise<boolean> {
  const ban = await getSovereignBan(userId)
  return ban?.cofounder_id !== null
}
