'use client'

import { motion } from 'framer-motion'
import { Crown, User } from 'lucide-react'
import { Card } from '@/components/ui'
import type { SovereignMember } from '../services/community-service'

interface MembersListProps {
  members: SovereignMember[]
}

export function MembersList({ members }: MembersListProps) {
  if (members.length === 0) {
    return (
      <Card hover={false} className="p-6">
        <div className="text-center text-zinc-500">
          No Sovereign members yet. Be the first!
        </div>
      </Card>
    )
  }

  return (
    <Card hover={false} className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Crown className="h-5 w-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">
          Sovereign Members ({members.length})
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/50 p-3"
          >
            <div className="relative">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.display_name || 'Member'}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
                  <User className="h-5 w-5 text-zinc-400" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 p-0.5">
                <Crown className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">
                {member.display_name || member.email.split('@')[0]}
              </p>
              <p className="text-xs text-zinc-500">
                Joined {new Date(member.joined_at).toLocaleDateString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
