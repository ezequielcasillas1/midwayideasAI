'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
        primary: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
        success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        danger: 'bg-red-500/20 text-red-300 border border-red-500/30',
        info: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

const categoryColors: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
  webapp: 'primary',
  mobile: 'info',
  game: 'success',
  api: 'warning',
  other: 'default',
}

interface CategoryBadgeProps extends Omit<BadgeProps, 'variant'> {
  category: string
}

const CategoryBadge = forwardRef<HTMLSpanElement, CategoryBadgeProps>(
  ({ category, className, ...props }, ref) => {
    const variant = categoryColors[category] || 'default'
    const label = category.charAt(0).toUpperCase() + category.slice(1)
    
    return (
      <Badge ref={ref} variant={variant} className={className} {...props}>
        {label}
      </Badge>
    )
  }
)

CategoryBadge.displayName = 'CategoryBadge'

export { Badge, badgeVariants, CategoryBadge }
