'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  History, User, Package, Megaphone, Handshake, 
  Crown, Star, Trash2, Edit2, Plus, Minus, ArrowRight,
  Loader2, RefreshCw
} from 'lucide-react'
import { Card } from '@/components/ui'
import { AdminSearchBar } from './AdminSearchBar'
import { AdminSelectFilter, AdminFilterBar, AdminSortSelect } from './AdminFilters'
import { ExportButton } from './ExportButton'
import { useActivityLog, type ActivityLogEntry } from '../hooks/useActivityLog'
import { exportActivityLog } from '../services/export-service'

const actionIcons: Record<string, React.ReactNode> = {
  update_cofounder_status: <Handshake className="h-4 w-4" />,
  toggle_listing_featured: <Star className="h-4 w-4" />,
  create_announcement: <Plus className="h-4 w-4" />,
  update_announcement: <Edit2 className="h-4 w-4" />,
  delete_announcement: <Trash2 className="h-4 w-4" />,
  update_user_tier: <Crown className="h-4 w-4" />,
  adjust_user_points: <Star className="h-4 w-4" />,
  update_user_display_name: <User className="h-4 w-4" />,
  remove_listing: <Package className="h-4 w-4" />,
  update_cofounder_notes: <Edit2 className="h-4 w-4" />,
}

const actionLabels: Record<string, string> = {
  update_cofounder_status: 'Changed co-founder status',
  toggle_listing_featured: 'Toggled listing feature',
  create_announcement: 'Created announcement',
  update_announcement: 'Updated announcement',
  delete_announcement: 'Deleted announcement',
  update_user_tier: 'Changed user tier',
  adjust_user_points: 'Adjusted user points',
  update_user_display_name: 'Updated display name',
  remove_listing: 'Removed listing',
  update_cofounder_notes: 'Updated co-founder notes',
}

const targetTypeIcons: Record<string, React.ReactNode> = {
  cofounder_request: <Handshake className="h-3 w-3" />,
  listing: <Package className="h-3 w-3" />,
  announcement: <Megaphone className="h-3 w-3" />,
  user: <User className="h-3 w-3" />,
}

type FilterAction = 'all' | 'cofounder' | 'listing' | 'announcement' | 'user'
type SortOption = 'newest' | 'oldest'

export function ActivityLog() {
  const { entries, loading, error, refresh } = useActivityLog(100)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAction, setFilterAction] = useState<FilterAction>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const filteredEntries = useMemo(() => {
    let result = [...entries]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(e => 
        e.action.toLowerCase().includes(query) ||
        e.target_type.toLowerCase().includes(query) ||
        e.target_id?.toLowerCase().includes(query) ||
        e.admin?.display_name?.toLowerCase().includes(query) ||
        e.admin?.email?.toLowerCase().includes(query) ||
        JSON.stringify(e.details).toLowerCase().includes(query)
      )
    }
    
    if (filterAction !== 'all') {
      result = result.filter(e => {
        if (filterAction === 'cofounder') return e.target_type === 'cofounder_request'
        if (filterAction === 'listing') return e.target_type === 'listing'
        if (filterAction === 'announcement') return e.target_type === 'announcement'
        if (filterAction === 'user') return e.target_type === 'user'
        return true
      })
    }
    
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })
    
    return result
  }, [entries, searchQuery, filterAction, sortBy])

  function formatTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  function formatDetails(entry: ActivityLogEntry): React.ReactNode {
    const { action, details } = entry
    
    if (action === 'update_cofounder_status' && details.status) {
      return (
        <span className="flex items-center gap-1">
          Status <ArrowRight className="h-3 w-3" /> 
          <span className="font-medium">{String(details.status)}</span>
        </span>
      )
    }
    
    if (action === 'toggle_listing_featured') {
      return details.isFeatured ? (
        <span className="text-amber-400">Featured</span>
      ) : (
        <span className="text-zinc-400">Unfeatured</span>
      )
    }
    
    if (action === 'update_user_tier' && details.tier) {
      return (
        <span className="flex items-center gap-1">
          Tier <ArrowRight className="h-3 w-3" /> 
          <span className="font-medium capitalize">{String(details.tier)}</span>
        </span>
      )
    }
    
    if (action === 'adjust_user_points') {
      const amount = Number(details.amount)
      return (
        <span className={amount >= 0 ? 'text-green-400' : 'text-red-400'}>
          {amount >= 0 ? '+' : ''}{amount} points
          {details.reason && <span className="text-zinc-500"> ({String(details.reason)})</span>}
        </span>
      )
    }
    
    if (action === 'create_announcement' && details.title) {
      return <span>"{String(details.title)}"</span>
    }
    
    if (action === 'remove_listing' && details.reason) {
      return <span className="text-red-400">Reason: {String(details.reason)}</span>
    }
    
    if (action === 'update_announcement') {
      if (details.is_pinned !== undefined) {
        return details.is_pinned ? 'Pinned' : 'Unpinned'
      }
      if (details.published_at !== undefined) {
        return details.published_at ? 'Published' : 'Unpublished'
      }
    }
    
    return null
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  if (error) {
    return (
      <Card hover={false} className="p-8">
        <div className="text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 text-sm text-violet-400 hover:text-violet-300"
          >
            Try again
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <AdminFilterBar>
        <AdminSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search actions, targets, admins..."
          className="min-w-[200px] flex-1"
        />
        <AdminSelectFilter
          label="Action Type"
          value={filterAction}
          onChange={(v) => setFilterAction(v as FilterAction)}
          options={[
            { value: 'all', label: 'All Actions' },
            { value: 'cofounder', label: 'Co-founder' },
            { value: 'listing', label: 'Listing' },
            { value: 'announcement', label: 'Announcement' },
            { value: 'user', label: 'User' },
          ]}
        />
        <AdminSortSelect
          value={sortBy}
          onChange={(v) => setSortBy(v as SortOption)}
          options={[
            { value: 'newest', label: 'Newest First' },
            { value: 'oldest', label: 'Oldest First' },
          ]}
        />
        <div className="flex items-end gap-2">
          <ExportButton onExport={exportActivityLog} label="Export" />
          <button
            onClick={refresh}
            className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </AdminFilterBar>

      <div className="text-sm text-zinc-500">
        {filteredEntries.length} action{filteredEntries.length !== 1 ? 's' : ''}
        {filteredEntries.length !== entries.length && ` (filtered from ${entries.length})`}
      </div>

      <div className="space-y-2">
        {filteredEntries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <Card hover={false} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-zinc-800 p-2 text-violet-400">
                    {actionIcons[entry.action] || <History className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">
                        {actionLabels[entry.action] || entry.action}
                      </span>
                      {entry.target_id && (
                        <span className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                          {targetTypeIcons[entry.target_type]}
                          <span className="font-mono">{entry.target_id.slice(0, 8)}...</span>
                        </span>
                      )}
                    </div>
                    
                    {formatDetails(entry) && (
                      <div className="mt-1 text-sm text-zinc-400">
                        {formatDetails(entry)}
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                      {entry.admin && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {entry.admin.display_name || entry.admin.email}
                        </span>
                      )}
                      <span>{formatTime(entry.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {filteredEntries.length === 0 && (
          <Card hover={false} className="p-8">
            <div className="text-center text-zinc-500">
              {searchQuery || filterAction !== 'all'
                ? 'No actions match your filters'
                : 'No activity logged yet'
              }
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
