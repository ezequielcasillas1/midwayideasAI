'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Crown, Shield, Sword, Castle, Star } from 'lucide-react'
import type { MembershipTier } from '../types'

const membershipBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      tier: {
        citizen: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
        knight: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        baron: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        duke: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        sovereign: 'bg-gradient-to-r from-amber-500/30 to-rose-500/30 text-amber-200 border border-amber-500/40',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
      },
    },
    defaultVariants: {
      tier: 'citizen',
      size: 'sm',
    },
  }
)

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

export interface MembershipBadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof membershipBadgeVariants> {
  tier: MembershipTier
  showIcon?: boolean
  isVerified?: boolean
}

const MembershipBadge = forwardRef<HTMLSpanElement, MembershipBadgeProps>(
  ({ tier, size, showIcon = true, isVerified = false, className, ...props }, ref) => {
    const Icon = tierIcons[tier]
    const label = tierLabels[tier]
    const iconSize = size === 'lg' ? 'h-4 w-4' : size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'

    return (
      <span
        ref={ref}
        className={cn(membershipBadgeVariants({ tier, size }), className)}
        {...props}
      >
        {showIcon && <Icon className={iconSize} />}
        <span>{label}</span>
        {tier === 'citizen' && isVerified && (
          <span className="ml-0.5 text-emerald-400">✓</span>
        )}
      </span>
    )
  }
)

MembershipBadge.displayName = 'MembershipBadge'

export { MembershipBadge, membershipBadgeVariants }
