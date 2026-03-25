'use client'

import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface FeaturedBadgeProps {
  size?: 'sm' | 'md'
  className?: string
}

export function FeaturedBadge({ size = 'sm', className = '' }: FeaturedBadgeProps) {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-1 rounded-full
        bg-gradient-to-r from-amber-500 to-orange-500
        font-semibold text-white shadow-lg shadow-amber-500/25
        ${sizes[size]}
        ${className}
      `}
    >
      <Sparkles className={iconSizes[size]} />
      <span>Featured</span>
    </motion.div>
  )
}
