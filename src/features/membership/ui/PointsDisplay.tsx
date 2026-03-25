'use client'

import { motion } from 'framer-motion'
import { Zap, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PointsDisplayProps {
  points: number
  cap: number
  earningRate: number
  betaEnabled: boolean
  size?: 'sm' | 'md' | 'lg'
  showRate?: boolean
  className?: string
}

export function PointsDisplay({
  points,
  cap,
  earningRate,
  betaEnabled,
  size = 'md',
  showRate = true,
  className,
}: PointsDisplayProps) {
  const percentage = Math.min((points / cap) * 100, 100)
  const isAtCap = points >= cap

  const sizeStyles = {
    sm: {
      container: 'gap-1',
      text: 'text-sm',
      bar: 'h-1.5',
      icon: 'h-3 w-3',
    },
    md: {
      container: 'gap-2',
      text: 'text-base',
      bar: 'h-2',
      icon: 'h-4 w-4',
    },
    lg: {
      container: 'gap-3',
      text: 'text-lg',
      bar: 'h-3',
      icon: 'h-5 w-5',
    },
  }

  const styles = sizeStyles[size]

  return (
    <div className={cn('flex flex-col', styles.container, className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className={cn(styles.icon, 'text-violet-400')} />
          <span className={cn(styles.text, 'font-semibold text-white')}>
            {points.toLocaleString()}
          </span>
          <span className={cn(styles.text, 'text-zinc-500')}>
            / {cap.toLocaleString()} pts
          </span>
        </div>

        {showRate && betaEnabled && earningRate > 1 && (
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              {earningRate}x
            </span>
            <span className="text-xs text-emerald-500">Beta</span>
          </div>
        )}
      </div>

      <div className={cn('w-full rounded-full bg-zinc-800', styles.bar)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            isAtCap
              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
              : 'bg-gradient-to-r from-violet-500 to-indigo-500'
          )}
        />
      </div>

      {isAtCap && (
        <p className="text-xs text-amber-400">
          Sovereign status achieved!
        </p>
      )}
    </div>
  )
}
