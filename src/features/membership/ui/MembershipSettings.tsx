'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, CreditCard, Zap, ExternalLink, Loader2 } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { MembershipBadge } from './MembershipBadge'
import { PointsDisplay } from './PointsDisplay'
import type { MembershipTier } from '../types'

interface MembershipSettingsProps {
  tier: MembershipTier
  points: number
  pointsCap: number
  earningRate: number
  betaEnabled: boolean
  isVerified: boolean
  isSubscribed: boolean
  onToggleBeta: () => Promise<void>
  onOpenPortal: () => Promise<void>
  onUpgrade: () => void
}

export function MembershipSettings({
  tier,
  points,
  pointsCap,
  earningRate,
  betaEnabled,
  isVerified,
  isSubscribed,
  onToggleBeta,
  onOpenPortal,
  onUpgrade,
}: MembershipSettingsProps) {
  const [toggling, setToggling] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)

  const handleToggleBeta = async () => {
    setToggling(true)
    try {
      await onToggleBeta()
    } finally {
      setToggling(false)
    }
  }

  const handleOpenPortal = async () => {
    setOpeningPortal(true)
    try {
      const result = await onOpenPortal()
      if (result && typeof result === 'object' && 'url' in result) {
        window.open((result as { url: string }).url, '_blank')
      }
    } finally {
      setOpeningPortal(false)
    }
  }

  return (
    <Card hover={false} className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <Settings className="h-5 w-5 text-zinc-400" />
        <h2 className="text-lg font-semibold text-white">Membership Settings</h2>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Current Tier</p>
            <div className="mt-1">
              <MembershipBadge tier={tier} size="md" isVerified={isVerified} />
            </div>
          </div>
          {tier !== 'sovereign' && (
            <Button variant="secondary" size="sm" onClick={onUpgrade}>
              Upgrade
            </Button>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-400">Points Balance</p>
          <PointsDisplay
            points={points}
            cap={pointsCap}
            earningRate={earningRate}
            betaEnabled={betaEnabled}
            size="md"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-violet-400" />
            <div>
              <p className="font-medium text-white">Beta Earning Rate</p>
              <p className="text-sm text-zinc-400">
                {betaEnabled
                  ? `Earning at ${earningRate}x rate`
                  : 'Earning at standard 1x rate'}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleBeta}
            disabled={toggling}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              betaEnabled ? 'bg-violet-500' : 'bg-zinc-700'
            }`}
          >
            <motion.div
              animate={{ x: betaEnabled ? 20 : 2 }}
              className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
            />
            {toggling && (
              <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />
            )}
          </motion.button>
        </div>

        {isSubscribed && (
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="font-medium text-white">Subscription</p>
                <p className="text-sm text-zinc-400">Manage billing and payment</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenPortal}
              disabled={openingPortal}
            >
              {openingPortal ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Manage
                  <ExternalLink className="ml-1 h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
