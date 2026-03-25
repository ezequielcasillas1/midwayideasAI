'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Coins, Info, Loader2, DollarSign, Sparkles } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useBuyPoints } from '../hooks/useBuyPoints'

interface BuyPointsModalProps {
  isOpen: boolean
  onClose: () => void
  currentPoints: number
}

function InfoPanel({ breakdown }: { breakdown: { dollars: number; points: number; bonus: number }[] }) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-white">How Points Work</h4>
      <p className="text-sm text-zinc-400">
        The more you spend, the better the value! Each additional dollar gives you 
        increasingly more bonus points.
      </p>
      
      <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800/50">
        <div className="grid grid-cols-3 border-b border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400">
          <span>Amount</span>
          <span className="text-center">Points</span>
          <span className="text-right">Bonus</span>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {breakdown.map(({ dollars, points, bonus }) => (
            <div 
              key={dollars} 
              className="grid grid-cols-3 border-b border-zinc-800 px-3 py-2 text-sm last:border-0"
            >
              <span className="text-zinc-300">${dollars}</span>
              <span className="text-center font-medium text-amber-400">{points}</span>
              <span className="text-right text-emerald-400">
                {bonus > 0 ? `+${bonus}` : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Base rate: 25 points per dollar. Bonus increases with each dollar spent.
      </p>
    </div>
  )
}

export function BuyPointsModal({ isOpen, onClose, currentPoints }: BuyPointsModalProps) {
  const { maxDollars, loading, error, calculatePoints, getBreakdown, createCheckout } = useBuyPoints()
  const [dollars, setDollars] = useState(1)
  const [showInfo, setShowInfo] = useState(false)

  const points = calculatePoints(dollars)
  const basePoints = dollars * 25
  const bonus = points - basePoints

  const handleDollarsChange = (value: string) => {
    const num = parseInt(value, 10)
    if (isNaN(num)) {
      setDollars(1)
    } else if (num < 1) {
      setDollars(1)
    } else if (num > maxDollars) {
      setDollars(maxDollars)
    } else {
      setDollars(num)
    }
  }

  const handlePurchase = async () => {
    try {
      const { url } = await createCheckout(dollars)
      if (url) {
        window.location.href = url
      }
    } catch {
      // Error handled in hook
    }
  }

  const quickAmounts = [1, 3, 5, 10]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 p-6">
              <div>
                <h2 className="text-xl font-bold text-white">Buy Points</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Balance: <span className="text-amber-400">{currentPoints} pts</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className={`rounded-lg p-2 transition-colors ${
                    showInfo 
                      ? 'bg-violet-500/20 text-violet-400' 
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <Info className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {showInfo ? (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <InfoPanel breakdown={getBreakdown()} />
                    <Button 
                      variant="secondary" 
                      className="mt-4 w-full"
                      onClick={() => setShowInfo(false)}
                    >
                      Back to Purchase
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="purchase"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Enter Amount ($1 - ${maxDollars})
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="number"
                          min={1}
                          max={maxDollars}
                          value={dollars}
                          onChange={(e) => handleDollarsChange(e.target.value)}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-3 pl-10 pr-4 text-xl font-bold text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {quickAmounts.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setDollars(amt)}
                          className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                            dollars === amt
                              ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                              : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>

                    <Card hover={false} className="bg-zinc-800/50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="h-5 w-5 text-amber-400" />
                          <span className="text-zinc-300">You'll receive</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-white">{points}</span>
                          <span className="ml-1 text-zinc-400">pts</span>
                        </div>
                      </div>
                      {bonus > 0 && (
                        <div className="mt-2 flex items-center justify-end gap-1 text-sm text-emerald-400">
                          <Sparkles className="h-3 w-3" />
                          <span>Includes +{bonus} bonus points!</span>
                        </div>
                      )}
                    </Card>

                    {error && (
                      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handlePurchase}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>Pay ${dollars}</>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
