'use client'

import { motion } from 'framer-motion'
import { Eye, TrendingUp, Package, Coins } from 'lucide-react'
import { Card } from '@/components/ui'
import type { AnalyticsOverview } from '../services/analytics-service'

interface AnalyticsStatsCardsProps {
  overview: AnalyticsOverview
}

export function AnalyticsStatsCards({ overview }: AnalyticsStatsCardsProps) {
  const stats = [
    {
      label: 'Total Views',
      value: overview.totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Views This Week',
      value: overview.viewsThisWeek.toLocaleString(),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      label: 'Active Listings',
      value: overview.totalListings.toLocaleString(),
      icon: Package,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10'
    },
    {
      label: 'Total Points',
      value: overview.totalPoints.toLocaleString(),
      icon: Coins,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10'
    }
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card hover={false} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
