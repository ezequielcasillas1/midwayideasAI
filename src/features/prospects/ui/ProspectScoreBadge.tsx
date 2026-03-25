'use client'

import { Flame, ThermometerSun, Snowflake } from 'lucide-react'
import { getScoreLevel } from '../services/prospect-service'

interface ProspectScoreBadgeProps {
  score: number
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ProspectScoreBadge({ 
  score, 
  showScore = true,
  size = 'md' 
}: ProspectScoreBadgeProps) {
  const level = getScoreLevel(score)
  
  const config = {
    hot: {
      label: 'Hot',
      icon: Flame,
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
    },
    warm: {
      label: 'Warm',
      icon: ThermometerSun,
      bgColor: 'bg-amber-500/20',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
    },
    cold: {
      label: 'Cold',
      icon: Snowflake,
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
    },
  }

  const { label, icon: Icon, bgColor, textColor, borderColor } = config[level]

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs gap-1',
    md: 'px-2 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <span 
      className={`inline-flex items-center rounded-full border ${bgColor} ${textColor} ${borderColor} ${sizeClasses[size]} font-medium`}
    >
      <Icon className={iconSizes[size]} />
      <span>{label}</span>
      {showScore && (
        <span className="opacity-75">({score})</span>
      )}
    </span>
  )
}

interface ProspectScoreBarProps {
  score: number
  showLabel?: boolean
}

export function ProspectScoreBar({ score, showLabel = true }: ProspectScoreBarProps) {
  const level = getScoreLevel(score)
  
  const barColors = {
    hot: 'bg-red-500',
    warm: 'bg-amber-500',
    cold: 'bg-blue-500',
  }

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">Prospect Score</span>
          <span className="font-medium text-white">{score}/100</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
        <div 
          className={`h-full rounded-full transition-all ${barColors[level]}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
