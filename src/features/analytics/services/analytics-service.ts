import { supabase } from '@/lib/supabase'
import type { ListingView, ListingStatsDaily, UserAnalytics } from '@/types'

export interface AnalyticsOverview {
  totalViews: number
  totalListings: number
  totalPoints: number
  viewsToday: number
  viewsThisWeek: number
  viewsThisMonth: number
}

export interface ListingPerformance {
  listingId: string
  listingTitle: string
  views: number
  uniqueViewers: number
}

export interface DailyViewData {
  date: string
  views: number
  uniqueViewers: number
}

export async function recordListingView(
  listingId: string,
  viewerId?: string,
  viewerIp?: string,
  referrer?: string
): Promise<void> {
  const { error } = await supabase
    .from('listing_views')
    .insert({
      listing_id: listingId,
      viewer_id: viewerId || null,
      viewer_ip: viewerIp || null,
      referrer: referrer || null
    })

  if (error) {
    console.error('Error recording view:', error)
  }
}

export async function getAnalyticsOverview(userId: string): Promise<AnalyticsOverview> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: listings } = await supabase
    .from('listings')
    .select('id')
    .eq('seller_id', userId)

  const listingIds = listings?.map(l => l.id) || []

  if (listingIds.length === 0) {
    return {
      totalViews: 0,
      totalListings: 0,
      totalPoints: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
      viewsThisMonth: 0
    }
  }

  const [totalViewsResult, todayViewsResult, weekViewsResult, monthViewsResult, pointsResult] = await Promise.all([
    supabase
      .from('listing_views')
      .select('id', { count: 'exact', head: true })
      .in('listing_id', listingIds),
    supabase
      .from('listing_views')
      .select('id', { count: 'exact', head: true })
      .in('listing_id', listingIds)
      .gte('created_at', todayStart),
    supabase
      .from('listing_views')
      .select('id', { count: 'exact', head: true })
      .in('listing_id', listingIds)
      .gte('created_at', weekStart),
    supabase
      .from('listing_views')
      .select('id', { count: 'exact', head: true })
      .in('listing_id', listingIds)
      .gte('created_at', monthStart),
    supabase
      .from('memberships')
      .select('points')
      .eq('user_id', userId)
      .single()
  ])

  return {
    totalViews: totalViewsResult.count || 0,
    totalListings: listingIds.length,
    totalPoints: pointsResult.data?.points || 0,
    viewsToday: todayViewsResult.count || 0,
    viewsThisWeek: weekViewsResult.count || 0,
    viewsThisMonth: monthViewsResult.count || 0
  }
}

export async function getListingPerformance(userId: string): Promise<ListingPerformance[]> {
  const { data: listings } = await supabase
    .from('listings')
    .select('id, title')
    .eq('seller_id', userId)

  if (!listings || listings.length === 0) return []

  const performanceData: ListingPerformance[] = []

  for (const listing of listings) {
    const { count: views } = await supabase
      .from('listing_views')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listing.id)

    const { data: uniqueData } = await supabase
      .from('listing_views')
      .select('viewer_id, viewer_ip')
      .eq('listing_id', listing.id)

    const uniqueViewers = new Set(
      uniqueData?.map(v => v.viewer_id || v.viewer_ip).filter(Boolean)
    ).size

    performanceData.push({
      listingId: listing.id,
      listingTitle: listing.title,
      views: views || 0,
      uniqueViewers
    })
  }

  return performanceData.sort((a, b) => b.views - a.views)
}

export async function getDailyViews(userId: string, days: number = 30): Promise<DailyViewData[]> {
  const { data: listings } = await supabase
    .from('listings')
    .select('id')
    .eq('seller_id', userId)

  const listingIds = listings?.map(l => l.id) || []

  if (listingIds.length === 0) return []

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: dailyStats } = await supabase
    .from('listing_stats_daily')
    .select('date, view_count, unique_viewers')
    .in('listing_id', listingIds)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  const aggregatedByDate = new Map<string, { views: number; uniqueViewers: number }>()

  dailyStats?.forEach(stat => {
    const existing = aggregatedByDate.get(stat.date) || { views: 0, uniqueViewers: 0 }
    aggregatedByDate.set(stat.date, {
      views: existing.views + stat.view_count,
      uniqueViewers: existing.uniqueViewers + stat.unique_viewers
    })
  })

  const result: DailyViewData[] = []
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const data = aggregatedByDate.get(dateStr) || { views: 0, uniqueViewers: 0 }
    result.push({
      date: dateStr,
      views: data.views,
      uniqueViewers: data.uniqueViewers
    })
  }

  return result
}

export async function canAccessAnalytics(userId: string): Promise<boolean> {
  const { bypassTierCheck } = await import('@/lib/admin-config')
  if (bypassTierCheck()) return true

  const { data, error } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', userId)
    .single()

  if (error || !data) return false

  return ['duke', 'sovereign'].includes(data.tier)
}
