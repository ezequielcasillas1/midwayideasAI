'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Shield, Sword, Castle, Star, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { TIER_CONFIG, TIER_ORDER } from '@/lib/membership-config'
import type { MembershipTier } from '../types'

const tierIcons: Record<MembershipTier, typeof Crown> = {
  citizen: Shield,
  knight: Sword,
  baron: Castle,
  duke: Star,
  sovereign: Crown,
}

const tierGradients: Record<MembershipTier, string> = {
  citizen: 'from-zinc-600 to-zinc-700',
  knight: 'from-blue-500 to-blue-600',
  baron: 'from-purple-500 to-purple-600',
  duke: 'from-amber-500 to-amber-600',
  sovereign: 'from-amber-400 via-rose-500 to-purple-600',
}

const tierBorders: Record<MembershipTier, string> = {
  citizen: 'border-zinc-700 hover:border-zinc-600',
  knight: 'border-blue-500/30 hover:border-blue-500/60',
  baron: 'border-purple-500/30 hover:border-purple-500/60',
  duke: 'border-amber-500/30 hover:border-amber-500/60',
  sovereign: 'border-amber-400/40 hover:border-amber-400/70',
}

export function MembershipTiers() {
  const [expandedTier, setExpandedTier] = useState<MembershipTier | null>(null)

  const toggleExpanded = (tier: MembershipTier) => {
    setExpandedTier(expandedTier === tier ? null : tier)
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Membership Tiers
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            Unlock exclusive benefits and increased earning rates to reach Sovereign status faster
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {TIER_ORDER.map((tier, index) => {
            const config = TIER_CONFIG[tier]
            const Icon = tierIcons[tier]
            const isPopular = tier === 'duke'
            const isSovereign = tier === 'sovereign'
            const isExpanded = expandedTier === tier

            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className={`
                  relative rounded-2xl border-2 bg-zinc-900/80 p-6 backdrop-blur-sm
                  ${tierBorders[tier]}
                  ${isSovereign ? 'lg:col-span-1' : ''}
                  ${isPopular ? 'pt-10' : ''}
                  transition-all duration-300
                `}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-4 flex items-center gap-3">
                  <div className={`rounded-xl bg-gradient-to-br p-3 ${tierGradients[tier]}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{config.name}</h3>
                    <p className="text-sm text-zinc-500">{config.earningRate}x earning rate</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">{config.priceLabel}</span>
                </div>

                <div className="mb-6 flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                  <span className="text-sm text-zinc-400">Earning Rate:</span>
                  <span className={`font-semibold ${config.earningRate > 1 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                    {config.earningRate}x
                  </span>
                </div>

                <ul className="mb-4 space-y-2">
                  {config.features.slice(0, 4).map((feature, i) => (
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

                <Link href="/auth/signup">
                  <Button
                    variant={isSovereign ? 'primary' : tier === 'citizen' ? 'ghost' : 'secondary'}
                    className="w-full"
                  >
                    {tier === 'citizen' ? 'Get Started Free' : `Choose ${config.name}`}
                  </Button>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
