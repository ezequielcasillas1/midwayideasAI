'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Loader2, Crown, Shield, Sword, Castle, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui'
import { TIER_CONFIG, TIER_ORDER, canUpgradeTo } from '@/lib/membership-config'
import type { MembershipTier } from '../types'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentTier: MembershipTier
  onSelectTier: (tier: MembershipTier) => Promise<void>
}

const tierIcons: Record<MembershipTier, typeof Crown> = {
  citizen: Shield,
  knight: Sword,
  baron: Castle,
  duke: Star,
  sovereign: Crown,
}

const tierColors: Record<MembershipTier, string> = {
  citizen: 'border-zinc-700 bg-zinc-800/50',
  knight: 'border-blue-500/50 bg-blue-500/10',
  baron: 'border-purple-500/50 bg-purple-500/10',
  duke: 'border-amber-500/50 bg-amber-500/10',
  sovereign: 'border-amber-400/50 bg-gradient-to-br from-amber-500/20 to-rose-500/20',
}

export function UpgradeModal({ isOpen, onClose, currentTier, onSelectTier }: UpgradeModalProps) {
  const [loading, setLoading] = useState<MembershipTier | null>(null)
  const [expandedTier, setExpandedTier] = useState<MembershipTier | null>(null)

  const handleSelect = async (tier: MembershipTier) => {
    if (!canUpgradeTo(currentTier, tier)) return
    
    setLoading(tier)
    try {
      await onSelectTier(tier)
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setLoading(null)
    }
  }

  const toggleExpanded = (tier: MembershipTier) => {
    setExpandedTier(expandedTier === tier ? null : tier)
  }

  const upgradableTiers = TIER_ORDER.filter((tier) => canUpgradeTo(currentTier, tier))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto pt-10 pb-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-[101] mx-4 w-full max-w-5xl rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Upgrade Membership</h2>
            <p className="text-zinc-400">Choose a tier to unlock more features</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {upgradableTiers.map((tier) => {
            const config = TIER_CONFIG[tier]
            const Icon = tierIcons[tier]
            const isLoading = loading === tier
            const isExpanded = expandedTier === tier
            const isPopular = tier === 'duke'

            return (
              <motion.div
                key={tier}
                whileHover={{ y: -4 }}
                className={`relative rounded-xl border-2 p-5 ${tierColors[tier]} ${isPopular ? 'pt-8' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-4 flex items-center gap-2">
                  <div className={`rounded-lg p-2 ${tier === 'sovereign' ? 'bg-amber-500/20' : 'bg-zinc-800'}`}>
                    <Icon className={`h-6 w-6 ${tier === 'sovereign' ? 'text-amber-400' : 'text-white'}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{config.name}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold text-white">
                    {config.priceLabel}
                  </span>
                </div>

                <ul className="mb-4 space-y-2">
                  {config.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => toggleExpanded(tier)}
                  className="mb-4 flex w-full items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      Hide details
                      <ChevronUp className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      See all features
                      <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-3 space-y-3">
                        <div>
                          <p className="text-xs font-medium text-emerald-400 mb-2">Included</p>
                          <ul className="space-y-1">
                            {config.allFeatures.included.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                                <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-400" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {config.allFeatures.excluded.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-zinc-500 mb-2">Not included</p>
                            <ul className="space-y-1">
                              {config.allFeatures.excluded.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-zinc-500">
                                  <X className="mt-0.5 h-3 w-3 flex-shrink-0 text-zinc-600" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  onClick={() => handleSelect(tier)}
                  disabled={isLoading || loading !== null}
                  className="w-full"
                  variant={tier === 'sovereign' ? 'primary' : 'secondary'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Upgrade to ${config.name}`
                  )}
                </Button>
              </motion.div>
            )
          })}
        </div>

        {upgradableTiers.length === 0 && (
          <div className="py-12 text-center">
            <Crown className="mx-auto mb-4 h-12 w-12 text-amber-400" />
            <p className="text-lg text-white">You have the highest tier!</p>
            <p className="text-zinc-400">Enjoy your Sovereign benefits.</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
