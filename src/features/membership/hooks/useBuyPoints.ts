'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  calculatePointsForDollars, 
  getPointsBreakdown,
  POINTS_MAX_PURCHASE_DOLLARS 
} from '@/lib/membership-config'

interface CheckoutResult {
  sessionId: string
  url: string
}

interface UseBuyPointsReturn {
  maxDollars: number
  loading: boolean
  error: string | null
  calculatePoints: (dollars: number) => number
  getBreakdown: () => { dollars: number; points: number; bonus: number }[]
  createCheckout: (dollars: number) => Promise<CheckoutResult>
}

export function useBuyPoints(): UseBuyPointsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCheckout = useCallback(async (dollars: number): Promise<CheckoutResult> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/stripe/points-checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dollars }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      return response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create checkout'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    maxDollars: POINTS_MAX_PURCHASE_DOLLARS,
    loading,
    error,
    calculatePoints: calculatePointsForDollars,
    getBreakdown: getPointsBreakdown,
    createCheckout,
  }
}
