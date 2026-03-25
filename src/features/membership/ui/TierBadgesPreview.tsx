'use client'

import { motion } from 'framer-motion'
import { Crown, Shield, Sword, Castle, Star, Lock } from 'lucide-react'
import { TIER_ORDER } from '@/lib/membership-config'
import type { MembershipTier } from '../types'

interface TierBadgesPreviewProps {
  currentTier: MembershipTier
  className?: string
}

const tierIcons: Record<MembershipTier, typeof Crown> = {
  citizen: Shield,
  knight: Sword,
  baron: Castle,
  duke: Star,
  sovereign: Crown,
}

const tierLabels: Record<MembershipTier, string> = {
  citizen: 'Citizen',
  knight: 'Knight',
  baron: 'Baron',
  duke: 'Duke',
  sovereign: 'Sovereign',
}

const tierStyles: Record<MembershipTier, { bg: string; border: string; icon: string; glow: string }> = {
  citizen: {
    bg: 'bg-zinc-800',
    border: 'border-zinc-600',
    icon: 'text-zinc-400',
    glow: '',
  },
  knight: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    icon: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  baron: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/50',
    icon: 'text-purple-400',
    glow: 'shadow-purple-500/20',
  },
  duke: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/50',
    icon: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  sovereign: {
    bg: 'bg-gradient-to-br from-amber-500/30 to-rose-500/30',
    border: 'border-amber-400/60',
    icon: 'text-amber-300',
    glow: 'shadow-amber-500/30',
  },
}

export function TierBadgesPreview({ currentTier, className = '' }: TierBadgesPreviewProps) {
  const currentIndex = TIER_ORDER.indexOf(currentTier)

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      {TIER_ORDER.map((tier, index) => {
        const Icon = tierIcons[tier]
        const styles = tierStyles[tier]
        const isUnlocked = index <= currentIndex
        const isCurrent = tier === currentTier

        return (
          <motion.div
            key={tier}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div
              className={`
                relative flex flex-col items-center gap-2 rounded-xl border-2 p-4
                ${isUnlocked ? styles.bg : 'bg-zinc-900/50'}
                ${isUnlocked ? styles.border : 'border-zinc-800'}
                ${isUnlocked && tier !== 'citizen' ? `shadow-lg ${styles.glow}` : ''}
                ${isCurrent ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-950' : ''}
                transition-all duration-300
              `}
            >
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-950/60 backdrop-blur-[2px]">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </div>
              )}
              
              <div className={`rounded-lg p-2 ${isUnlocked ? styles.bg : 'bg-zinc-800'}`}>
                <Icon className={`h-6 w-6 ${isUnlocked ? styles.icon : 'text-zinc-600'}`} />
              </div>
              
              <span className={`text-sm font-medium ${isUnlocked ? 'text-white' : 'text-zinc-600'}`}>
                {tierLabels[tier]}
              </span>

              {isCurrent && (
                <span className="absolute -bottom-2 rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-medium text-white">
                  Current
                </span>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
