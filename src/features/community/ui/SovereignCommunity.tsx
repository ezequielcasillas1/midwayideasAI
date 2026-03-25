'use client'

import { motion } from 'framer-motion'
import { Crown, Lock, Users, Sparkles } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { useCommunity } from '../hooks/useCommunity'
import { MembersList } from './MembersList'
import { AnnouncementsFeed } from './AnnouncementsFeed'

export function SovereignCommunity() {
  const { announcements, members, hasAccess, loading, markAsRead } = useCommunity()

  if (loading) {
    return (
      <div className="space-y-6">
        <Card hover={false} className="h-24 animate-pulse bg-zinc-800/50" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card hover={false} className="h-64 animate-pulse bg-zinc-800/50" />
          </div>
          <Card hover={false} className="h-64 animate-pulse bg-zinc-800/50" />
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
          <h2 className="mb-2 text-xl font-bold text-white">Exclusive Community</h2>
          <p className="mb-6 max-w-md text-zinc-400">
            Join our exclusive Sovereign community to connect with other premium members, 
            get early access to features, and receive direct updates from the founder.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-amber-400">
            <Crown className="h-5 w-5" />
            <span className="font-medium">Sovereign tier required</span>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <Card hover={false} className="overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500/20 via-violet-500/20 to-rose-500/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-amber-500/20 p-3">
                <Crown className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Sovereign Community</h1>
                <p className="text-zinc-400">Welcome to the exclusive inner circle</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-zinc-900/50 px-4 py-2 sm:flex">
              <Users className="h-4 w-4 text-zinc-400" />
              <span className="text-sm text-zinc-300">{members.length} members</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AnnouncementsFeed 
            announcements={announcements} 
            onAnnouncementClick={markAsRead}
          />
        </div>
        <div>
          <MembersList members={members} />
        </div>
      </div>
    </motion.div>
  )
}
