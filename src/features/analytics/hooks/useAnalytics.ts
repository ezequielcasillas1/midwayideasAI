'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { USE_MOCK_DATA, mockAnalyticsOverview, mockListingPerformance, mockDailyViews } from '@/lib/mockData'
import {
  getAnalyticsOverview,
  getListingPerformance,
  getDailyViews,
  canAccessAnalytics,
  type AnalyticsOverview,
  type ListingPerformance,
  type DailyViewData
} from '../services/analytics-service'

export function useAnalytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [performance, setPerformance] = useState<ListingPerformance[]>([])
  const [dailyViews, setDailyViews] = useState<DailyViewData[]>([])
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (USE_MOCK_DATA) {
      setHasAccess(true)
      setOverview(mockAnalyticsOverview)
      setPerformance(mockListingPerformance)
      setDailyViews(mockDailyViews)
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      const access = await canAccessAnalytics(user.id)
      setHasAccess(access)

      if (!access) {
        setLoading(false)
        return
      }

      const [overviewData, performanceData, dailyData] = await Promise.all([
        getAnalyticsOverview(user.id),
        getListingPerformance(user.id),
        getDailyViews(user.id, 30)
      ])

      setOverview(overviewData)
      setPerformance(performanceData)
      setDailyViews(dailyData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    overview,
    performance,
    dailyViews,
    hasAccess,
    loading,
    error,
    refetch: fetchAnalytics
  }
}
