'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Clock, MessageSquare, CheckCircle, XCircle, Loader2,
  Mail, ExternalLink, Edit2, Check, X, FileText, ChevronDown, ChevronUp
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { AdminSearchBar } from './AdminSearchBar'
import { AdminSelectFilter, AdminFilterBar, AdminSortSelect } from './AdminFilters'
import { ExportButton } from './ExportButton'
import { UserDetailModal } from './UserDetailModal'
import { CofounderStatus } from '@/features/cofounder'
import { updateCofounderRequestStatus, updateCofounderNotes } from '../services/admin-service'
import { exportCofounderRequests } from '../services/export-service'
import type { CofounderRequest, User as UserType, CofounderRequestStatus as StatusType } from '@/types'

interface CofounderRequestsListProps {
  requests: (CofounderRequest & { user: UserType })[]
  onUpdate: () => void
}

type FilterStatus = 'all' | 'pending' | 'in_discussion' | 'approved' | 'rejected'
type SortOption = 'newest' | 'oldest' | 'status'

export function CofounderRequestsList({ requests, onUpdate }: CofounderRequestsListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredRequests = useMemo(() => {
    let result = [...requests]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(r => 
        r.user?.display_name?.toLowerCase().includes(query) ||
        r.user?.email?.toLowerCase().includes(query) ||
        r.vision?.toLowerCase().includes(query) ||
        r.experience?.toLowerCase().includes(query)
      )
    }
    
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus)
    }
    
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'status') {
        const statusOrder = { pending: 0, in_discussion: 1, approved: 2, rejected: 3 }
        return statusOrder[a.status] - statusOrder[b.status]
      }
      return 0
    })
    
    return result
  }, [requests, searchQuery, filterStatus, sortBy])

  const handleStatusUpdate = async (requestId: string, status: StatusType) => {
    setUpdatingId(requestId)
    const success = await updateCofounderRequestStatus(requestId, status)
    if (success) {
      onUpdate()
    }
    setUpdatingId(null)
  }

  const handleBulkAction = async (status: StatusType) => {
    for (const id of selectedIds) {
      await handleStatusUpdate(id, status)
    }
    setSelectedIds(new Set())
  }

  const startEditingNotes = (request: CofounderRequest) => {
    setEditingNotesId(request.id)
    setNotesValue(request.admin_notes || '')
  }

  const saveNotes = async (requestId: string) => {
    setSavingNotes(true)
    const success = await updateCofounderNotes(requestId, notesValue)
    if (success) {
      onUpdate()
      setEditingNotesId(null)
      setNotesValue('')
    }
    setSavingNotes(false)
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRequests.map(r => r.id)))
    }
  }

  return (
    <div className="space-y-4">
      <AdminFilterBar>
        <AdminSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, email, vision..."
          className="min-w-[200px] flex-1"
        />
        <AdminSelectFilter
          label="Status"
          value={filterStatus}
          onChange={(v) => setFilterStatus(v as FilterStatus)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'in_discussion', label: 'In Discussion' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
        <AdminSortSelect
          value={sortBy}
          onChange={(v) => setSortBy(v as SortOption)}
          options={[
            { value: 'newest', label: 'Newest' },
            { value: 'oldest', label: 'Oldest' },
            { value: 'status', label: 'Status' },
          ]}
        />
        <ExportButton onExport={exportCofounderRequests} label="Export" />
      </AdminFilterBar>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-violet-500/30 bg-violet-500/10 p-3">
          <span className="text-sm text-violet-300">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => handleBulkAction('approved')}>
              <CheckCircle className="mr-1 h-4 w-4" />
              Approve All
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleBulkAction('rejected')}>
              <XCircle className="mr-1 h-4 w-4" />
              Reject All
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-violet-500"
          />
          Select all
        </label>
        <span className="text-zinc-600">•</span>
        <span>{filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}</span>
      </div>

      {filteredRequests.length === 0 ? (
        <Card hover={false} className="p-8">
          <div className="text-center text-zinc-500">
            {searchQuery || filterStatus !== 'all' 
              ? 'No requests match your filters' 
              : 'No co-founder requests yet'
            }
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover={false} className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(request.id)}
                      onChange={() => toggleSelect(request.id)}
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-violet-500"
                    />
                    {request.user?.avatar_url ? (
                      <img
                        src={request.user.avatar_url}
                        alt={request.user.display_name || 'User'}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
                        <User className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {request.user?.display_name || request.user?.email?.split('@')[0] || 'Unknown'}
                        </p>
                        <button
                          onClick={() => {
                            setSelectedUserId(request.user_id)
                            setSelectedUserName(request.user?.display_name || '')
                          }}
                          className="text-xs text-violet-400 hover:text-violet-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-zinc-500">{request.user?.email}</p>
                        {request.user?.email && (
                          <a
                            href={`mailto:${request.user.email}?subject=Co-founder Application - Midway`}
                            className="text-violet-400 hover:text-violet-300"
                            title="Send email"
                          >
                            <Mail className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <CofounderStatus status={request.status} size="sm" />
                </div>

                {/* Vision & Experience (collapsible) */}
                <button
                  onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                  className="mb-3 flex w-full items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2 text-left hover:bg-zinc-800"
                >
                  <span className="flex items-center gap-2 text-sm text-zinc-400">
                    <FileText className="h-4 w-4" />
                    Application Details
                  </span>
                  {expandedId === request.id ? (
                    <ChevronUp className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  )}
                </button>

                {expandedId === request.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mb-4 space-y-3 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3"
                  >
                    {request.vision && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">Vision</p>
                        <p className="text-sm text-zinc-300">{request.vision}</p>
                      </div>
                    )}
                    {request.experience && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">Experience</p>
                        <p className="text-sm text-zinc-300">{request.experience}</p>
                      </div>
                    )}
                    {request.message && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">Message</p>
                        <p className="text-sm text-zinc-300">{request.message}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Admin Notes */}
                <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-400">Admin Notes</p>
                    {editingNotesId !== request.id && (
                      <button
                        onClick={() => startEditingNotes(request)}
                        className="text-xs text-violet-400 hover:text-violet-300"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {editingNotesId === request.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        rows={3}
                        className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500"
                        placeholder="Add internal notes about this request..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveNotes(request.id)}
                          disabled={savingNotes}
                          className="flex items-center gap-1 rounded bg-violet-600 px-2 py-1 text-xs text-white hover:bg-violet-500"
                        >
                          {savingNotes ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingNotesId(null)
                            setNotesValue('')
                          }}
                          className="flex items-center gap-1 rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-600"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-300">
                      {request.admin_notes || <span className="italic text-zinc-500">No notes yet</span>}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                  <p className="text-xs text-zinc-500">
                    Submitted {new Date(request.created_at).toLocaleDateString()}
                    {request.reviewed_at && (
                      <> • Reviewed {new Date(request.reviewed_at).toLocaleDateString()}</>
                    )}
                  </p>
                  
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        disabled={updatingId === request.id}
                      >
                        {updatingId === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatusUpdate(request.id, 'in_discussion')}
                        disabled={updatingId === request.id}
                      >
                        <MessageSquare className="mr-1 h-4 w-4" />
                        Discuss
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                        disabled={updatingId === request.id}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  )}

                  {request.status === 'in_discussion' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        disabled={updatingId === request.id}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                        disabled={updatingId === request.id}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <UserDetailModal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId}
        userName={selectedUserName}
        onUpdate={onUpdate}
      />
    </div>
  )
}
