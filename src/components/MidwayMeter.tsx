'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MidwayMeterProps {
  percent: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

const getColorClass = (percent: number): string => {
  if (percent < 25) return 'from-red-500 to-orange-500'
  if (percent < 50) return 'from-orange-500 to-amber-500'
  if (percent < 75) return 'from-amber-500 to-lime-500'
  return 'from-lime-500 to-emerald-500'
}

export function MidwayMeter({ 
  percent, 
  showLabel = true, 
  size = 'md',
  className 
}: MidwayMeterProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent))
  
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-zinc-400">Completion</span>
          <span className="font-semibold text-white">{clampedPercent}%</span>
        </div>
      )}
      <div className={cn(
        'w-full overflow-hidden rounded-full bg-zinc-800',
        sizeClasses[size]
      )}>
        <motion.div
          className={cn(
            'h-full rounded-full bg-gradient-to-r',
            getColorClass(clampedPercent)
          )}
          initial={{ width: 0 }}
          animate={{ width: `${clampedPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
