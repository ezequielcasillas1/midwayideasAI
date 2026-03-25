'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Users, Package, Crown, Handshake, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui'
import type { AdminStats } from '../services/admin-service'

interface AdminStatsCardsProps {
  stats: AdminStats
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const cards = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      href: '/admin/users',
      hoverBorder: 'hover:border-blue-500/50'
    },
    {
      label: 'Total Listings',
      value: stats.totalListings.toLocaleString(),
      icon: Package,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      href: '/admin/listings',
      hoverBorder: 'hover:border-emerald-500/50'
    },
    {
      label: 'Sovereign Members',
      value: stats.totalSovereigns.toLocaleString(),
      icon: Crown,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      href: '/admin/sovereigns',
      hoverBorder: 'hover:border-amber-500/50'
    },
    {
      label: 'Pending Requests',
      value: stats.pendingCofounderRequests.toLocaleString(),
      icon: Handshake,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      href: '/admin/cofounders',
      hoverBorder: 'hover:border-violet-500/50'
    }
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link href={card.href}>
            <Card hover={true} className={`cursor-pointer p-5 transition-all ${card.hoverBorder}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{card.value}</p>
                </div>
                <div className={`rounded-xl p-3 ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
              <div className={`mt-3 flex items-center gap-1 text-xs ${card.color}`}>
                <span>View details</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
