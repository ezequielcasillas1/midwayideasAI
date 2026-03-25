'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks'
import type { Subscription, MembershipTier, CheckoutSession, PortalSession } from '../types'

interface UseSubscriptionReturn {
  subscription: Subscription | null
  loading: boolean
  error: Error | null
  isActive: boolean
  createCheckout: (tier: MembershipTier) => Promise<CheckoutSession>
  openPortal: () => Promise<PortalSession>
  refetch: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setSubscription(null)
        } else {
          throw fetchError
        }
      } else {
        setSubscription(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch subscription'))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`subscription:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setSubscription(payload.new as Subscription)
          } else if (payload.eventType === 'DELETE') {
            setSubscription(null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const createCheckout = useCallback(async (tier: MembershipTier): Promise<CheckoutSession> => {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create checkout session')
    }

    return response.json()
  }, [])

  const openPortal = useCallback(async (): Promise<PortalSession> => {
    const response = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create portal session')
    }

    return response.json()
  }, [])

  const isActive = subscription?.status === 'active'

  return {
    subscription,
    loading,
    error,
    isActive,
    createCheckout,
    openPortal,
    refetch: fetchSubscription,
  }
}
