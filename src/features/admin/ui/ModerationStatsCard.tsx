'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui'
import { ShieldCheck, ShieldAlert, AlertTriangle, Eye } from 'lucide-react'
import { getModerationStats, type ModerationStats } from '../services/admin-service'

interface ModerationStatsCardProps {
  className?: string
}

export function ModerationStatsCard({ className }: ModerationStatsCardProps) {
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      const data = await getModerationStats(30)
      setStats(data)
      setLoading(false)
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <Card hover={false} className={`animate-pulse bg-zinc-800/50 p-5 ${className}`}>
        <div className="h-48" />
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const flagRate = stats.totalChecks > 0 
    ? ((stats.flaggedCount / stats.totalChecks) * 100).toFixed(1)
    : '0'

  return (
    <Card hover={false} className={`p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Moderation Stats</h2>
        </div>
        <span className="text-xs text-zinc-500">Last 30 days</span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-2xl font-bold text-white">{stats.totalChecks.toLocaleString()}</p>
          <p className="text-xs text-zinc-400">Total Checks</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-2xl font-bold text-amber-400">
            {stats.flaggedCount.toLocaleString()}
            <span className="ml-1 text-sm font-normal text-zinc-400">({flagRate}%)</span>
          </p>
          <p className="text-xs text-zinc-400">Flagged</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-zinc-300">By Source</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Tisane</span>
            <span className="text-sm font-medium text-white">{stats.tisaneFlagCount} flags</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">OpenAI</span>
            <span className="text-sm font-medium text-white">{stats.openAiFlagCount} flags</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Custom Rules</span>
            <span className="text-sm font-medium text-white">{stats.customFlagCount} flags</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-zinc-300">Severity</p>
        <div className="flex gap-2">
          <div className="flex-1 rounded bg-red-500/10 px-2 py-1 text-center">
            <p className="text-sm font-medium text-red-400">{stats.bySeverity.high}</p>
            <p className="text-xs text-zinc-500">High</p>
          </div>
          <div className="flex-1 rounded bg-amber-500/10 px-2 py-1 text-center">
            <p className="text-sm font-medium text-amber-400">{stats.bySeverity.medium}</p>
            <p className="text-xs text-zinc-500">Medium</p>
          </div>
          <div className="flex-1 rounded bg-green-500/10 px-2 py-1 text-center">
            <p className="text-sm font-medium text-green-400">{stats.bySeverity.low}</p>
            <p className="text-xs text-zinc-500">Low</p>
          </div>
        </div>
      </div>

      {stats.recentFlags.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-zinc-300">Recent Flags</p>
          <div className="space-y-2">
            {stats.recentFlags.slice(0, 3).map((flag) => (
              <div 
                key={flag.id}
                className="flex items-center gap-2 rounded bg-zinc-800/50 px-2 py-1.5 text-xs"
              >
                {flag.severity === 'high' ? (
                  <AlertTriangle className="h-3 w-3 text-red-400" />
                ) : flag.severity === 'medium' ? (
                  <ShieldAlert className="h-3 w-3 text-amber-400" />
                ) : (
                  <Eye className="h-3 w-3 text-zinc-400" />
                )}
                <span className="flex-1 truncate text-zinc-300">
                  {flag.content_type} - {flag.tisane_flagged ? 'Tisane' : flag.openai_flagged ? 'OpenAI' : 'Custom'}
                </span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  flag.severity === 'high' 
                    ? 'bg-red-500/20 text-red-400' 
                    : flag.severity === 'medium'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-zinc-700 text-zinc-400'
                }`}>
                  {flag.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/admin/moderation"
        className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-center text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        View All Moderation Logs
      </Link>
    </Card>
  )
}
