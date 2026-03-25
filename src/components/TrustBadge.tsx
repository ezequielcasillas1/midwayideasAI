'use client'

import { Shield, ShieldCheck, ShieldAlert, Crown, Star } from 'lucide-react'
import { 
  type TrustLevel, 
  getTrustLevelLabel, 
  getTrustLevelColor,
  getPointsToNextLevel,
  getNextTrustLevel,
} from '@/lib/trustScore'

interface TrustBadgeProps {
  level: TrustLevel
  score?: number
  showScore?: boolean
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
}

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
}

function TrustIcon({ level, size }: { level: TrustLevel; size: number }) {
  switch (level) {
    case 'elite':
      return <Crown size={size} className="text-amber-400" />
    case 'trusted':
      return <Star size={size} className="text-violet-400" />
    case 'verified':
      return <ShieldCheck size={size} className="text-green-400" />
    case 'basic':
      return <Shield size={size} className="text-blue-400" />
    default:
      return <ShieldAlert size={size} className="text-zinc-400" />
  }
}

export function TrustBadge({ 
  level, 
  score, 
  showScore = false,
  showProgress = false,
  size = 'md' 
}: TrustBadgeProps) {
  const colorClass = getTrustLevelColor(level)
  const label = getTrustLevelLabel(level)
  const iconSize = iconSizes[size]

  return (
    <div className="inline-flex flex-col gap-1">
      <span 
        className={`inline-flex items-center gap-1.5 rounded-full font-medium ${colorClass} ${sizeClasses[size]}`}
      >
        <TrustIcon level={level} size={iconSize} />
        <span>{label}</span>
        {showScore && score !== undefined && (
          <span className="opacity-70">({score})</span>
        )}
      </span>
      
      {showProgress && score !== undefined && (
        <TrustProgress level={level} score={score} />
      )}
    </div>
  )
}

interface TrustProgressProps {
  level: TrustLevel
  score: number
}

function TrustProgress({ level, score }: TrustProgressProps) {
  const nextLevel = getNextTrustLevel(level)
  const pointsNeeded = getPointsToNextLevel(score, level)

  if (!nextLevel || pointsNeeded === null) {
    return (
      <span className="text-xs text-zinc-500">Maximum level achieved</span>
    )
  }

  const thresholds: Record<TrustLevel, number> = {
    unverified: 0,
    basic: 15,
    verified: 50,
    trusted: 100,
    elite: 150,
  }

  const currentThreshold = thresholds[level]
  const nextThreshold = thresholds[nextLevel]
  const progress = ((score - currentThreshold) / (nextThreshold - currentThreshold)) * 100

  return (
    <div className="flex flex-col gap-0.5">
      <div className="h-1 w-24 rounded-full bg-zinc-800 overflow-hidden">
        <div 
          className="h-full bg-violet-500 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500">
        {pointsNeeded} pts to {getTrustLevelLabel(nextLevel)}
      </span>
    </div>
  )
}

interface TrustScoreDisplayProps {
  score: number
  level: TrustLevel
}

export function TrustScoreDisplay({ score, level }: TrustScoreDisplayProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className={`rounded-full p-2 ${getTrustLevelColor(level)}`}>
        <TrustIcon level={level} size={24} />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{score}</span>
          <span className="text-sm text-zinc-400">Trust Score</span>
        </div>
        <span className={`text-sm font-medium ${getTrustLevelColor(level).split(' ')[0]}`}>
          {getTrustLevelLabel(level)} Member
        </span>
      </div>
    </div>
  )
}
