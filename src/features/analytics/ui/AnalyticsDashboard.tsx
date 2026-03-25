'use client'

import { motion } from 'framer-motion'
import { BarChart3, Lock, Crown } from 'lucide-react'
import Link from 'next/link'
import { Button, Card } from '@/components/ui'
import { useAnalytics } from '../hooks/useAnalytics'
import { AnalyticsStatsCards } from './AnalyticsStatsCards'
import { ViewsChart } from './ViewsChart'
import { ListingPerformanceChart } from './ListingPerformanceChart'

export function AnalyticsDashboard() {
  const { overview, performance, dailyViews, hasAccess, loading, error } = useAnalytics()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} hover={false} className="h-24 animate-pulse bg-zinc-800/50" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card hover={false} className="h-[380px] animate-pulse bg-zinc-800/50" />
          <Card hover={false} className="h-[380px] animate-pulse bg-zinc-800/50" />
        </div>
      </div>
    )
  }

  if (hasAccess === false) {
    return (
      <Card hover={false} className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-amber-500/10 p-4">
            <Lock className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">Analytics Dashboard</h2>
          <p className="mb-6 max-w-md text-zinc-400">
            Upgrade to Duke or Sovereign tier to unlock detailed analytics about your listings, 
            including view counts, performance metrics, and trends over time.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-amber-400">
            <Crown className="h-5 w-5" />
            <span className="font-medium">Duke tier required</span>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card hover={false} className="p-8">
        <div className="text-center text-red-400">
          Failed to load analytics. Please try again later.
        </div>
      </Card>
    )
  }

  if (!overview) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/10 p-3">
            <BarChart3 className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-zinc-400">Track your listing performance</p>
          </div>
        </div>
      </div>

      <AnalyticsStatsCards overview={overview} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ViewsChart data={dailyViews} />
        <ListingPerformanceChart data={performance} />
      </div>
    </motion.div>
  )
}
