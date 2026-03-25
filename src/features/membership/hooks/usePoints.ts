'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks'
import type { PointTransaction } from '../types'

interface UsePointsReturn {
  transactions: PointTransaction[]
  loading: boolean
  error: Error | null
  totalEarned: number
  refetch: () => Promise<void>
}

export function usePoints(limit: number = 50): UsePointsReturn {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPoints = useCallback(async () => {
    if (!user?.id) {
      setTransactions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError
      setTransactions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch points'))
    } finally {
      setLoading(false)
    }
  }, [user?.id, limit])

  useEffect(() => {
    fetchPoints()
  }, [fetchPoints])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`points:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'point_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setTransactions((prev) => [payload.new as PointTransaction, ...prev].slice(0, limit))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, limit])

  const totalEarned = transactions.reduce(
    (sum, tx) => sum + (tx.amount > 0 ? tx.amount : 0),
    0
  )

  return {
    transactions,
    loading,
    error,
    totalEarned,
    refetch: fetchPoints,
  }
}
