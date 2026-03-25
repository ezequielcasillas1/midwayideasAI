'use client'

import { motion } from 'framer-motion'
import { Clock, MessageSquare, CheckCircle, XCircle, Crown } from 'lucide-react'
import type { CofounderRequestStatus } from '@/types'

interface CofounderStatusProps {
  status: CofounderRequestStatus
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<CofounderRequestStatus, {
  label: string
  icon: typeof Clock
  color: string
  bgColor: string
}> = {
  pending: {
    label: 'Pending Review',
    icon: Clock,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10'
  },
  in_discussion: {
    label: 'In Discussion',
    icon: MessageSquare,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10'
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10'
  },
  rejected: {
    label: 'Not Approved',
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10'
  }
}

export function CofounderStatus({ status, size = 'md' }: CofounderStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 rounded-full font-medium ${config.bgColor} ${config.color} ${sizes[size]}`}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </motion.div>
  )
}
