'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks'
import type { Membership, MembershipTier } from '../types'
import { TIER_CONFIG, getPointsCap, getEarningRate } from '@/lib/membership-config'

interface UseMembershipReturn {
  membership: Membership | null
  loading: boolean
  error: Error | null
  tier: MembershipTier
  tierConfig: typeof TIER_CONFIG[MembershipTier]
  points: number
  pointsCap: number
  earningRate: number
  betaEnabled: boolean
  isVerified: boolean
  toggleBetaEarningRate: () => Promise<void>
  refetch: () => Promise<void>
}

export function useMembership(): UseMembershipReturn {
  const { user } = useAuth()
  const [membership, setMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMembership = useCallback(async () => {
    if (!user?.id) {
      setMembership(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setMembership(null)
        } else {
          throw fetchError
        }
      } else {
        setMembership(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch membership'))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchMembership()
  }, [fetchMembership])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`membership:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memberships',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setMembership(payload.new as Membership)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const toggleBetaEarningRate = useCallback(async () => {
    if (!user?.id || !membership) return

    const newValue = !membership.beta_earning_rate

    setMembership((prev) => prev ? { ...prev, beta_earning_rate: newValue } : null)

    try {
      const { error: updateError } = await supabase
        .from('memberships')
        .update({ beta_earning_rate: newValue })
        .eq('user_id', user.id)

      if (updateError) throw updateError
    } catch (err) {
      setMembership((prev) => prev ? { ...prev, beta_earning_rate: !newValue } : null)
      throw err
    }
  }, [user?.id, membership])

  const tier = membership?.tier || 'citizen'
  const tierConfig = TIER_CONFIG[tier]
  const points = membership?.points || 0
  const pointsCap = getPointsCap(tier)
  const betaEnabled = membership?.beta_earning_rate ?? true
  const isVerified = membership?.is_verified ?? false
  const earningRate = getEarningRate(tier, betaEnabled, isVerified)

  return {
    membership,
    loading,
    error,
    tier,
    tierConfig,
    points,
    pointsCap,
    earningRate,
    betaEnabled,
    isVerified,
    toggleBetaEarningRate,
    refetch: fetchMembership,
  }
}
