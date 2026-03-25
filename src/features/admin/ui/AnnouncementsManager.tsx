'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pin, Send, Trash2, Edit2, Loader2, X, Check, Calendar } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { AdminSearchBar } from './AdminSearchBar'
import { AdminSelectFilter, AdminFilterBar, AdminSortSelect } from './AdminFilters'
import { InfoTooltip } from './InfoTooltip'
import { 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} from '../services/admin-service'
import type { CommunityAnnouncement } from '@/types'

interface AnnouncementsManagerProps {
  announcements: CommunityAnnouncement[]
  onUpdate: () => void
}

type FilterStatus = 'all' | 'published' | 'draft' | 'pinned'
type SortOption = 'created_desc' | 'created_asc' | 'published_desc' | 'title'

export function AnnouncementsManager({ announcements, onUpdate }: AnnouncementsManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortOption>('created_desc')

  const filteredAnnouncements = useMemo(() => {
    let result = [...announcements]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(a => 
        a.title.toLowerCase().includes(query) || 
        a.content.toLowerCase().includes(query)
      )
    }
    
    if (filterStatus !== 'all') {
      result = result.filter(a => {
        if (filterStatus === 'published') return !!a.published_at
        if (filterStatus === 'draft') return !a.published_at
        if (filterStatus === 'pinned') return a.is_pinned
        return true
      })
    }
    
    result.sort((a, b) => {
      if (sortBy === 'created_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'created_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'published_desc') {
        if (!a.published_at && !b.published_at) return 0
        if (!a.published_at) return 1
        if (!b.published_at) return -1
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      }
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      return 0
    })
    
    return result
  }, [announcements, searchQuery, filterStatus, sortBy])

  const resetForm = () => {
    setTitle('')
    setContent('')
    setIsPinned(false)
    setScheduledDate('')
    setShowForm(false)
    setEditingId(null)
  }

  const handleCreate = async (publish: boolean) => {
    if (!title.trim() || !content.trim()) return

    setSubmitting(true)
    
    if (editingId) {
      const publishedAt = publish 
        ? (scheduledDate || new Date().toISOString())
        : null
        
      const success = await updateAnnouncement(editingId, {
        title: title.trim(),
        content: content.trim(),
        is_pinned: isPinned,
        published_at: publishedAt
      })
      
      if (success) {
        resetForm()
        onUpdate()
      }
    } else {
      const result = await createAnnouncement(title, content, isPinned, publish)
      
      if (result) {
        resetForm()
        onUpdate()
      }
    }
    setSubmitting(false)
  }

  const handleEdit = (announcement: CommunityAnnouncement) => {
    setEditingId(announcement.id)
    setTitle(announcement.title)
    setContent(announcement.content)
    setIsPinned(announcement.is_pinned)
    setScheduledDate(announcement.published_at || '')
    setShowForm(true)
  }

  const handleTogglePublish = async (announcement: CommunityAnnouncement) => {
    const isPublished = !!announcement.published_at
    await updateAnnouncement(announcement.id, {
      published_at: isPublished ? null : new Date().toISOString()
    })
    onUpdate()
  }

  const handleTogglePin = async (announcement: CommunityAnnouncement) => {
    await updateAnnouncement(announcement.id, {
      is_pinned: !announcement.is_pinned
    })
    onUpdate()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    
    setDeletingId(id)
    const success = await deleteAnnouncement(id)
    if (success) {
      onUpdate()
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      <AdminFilterBar>
        <AdminSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search announcements..."
          className="min-w-[200px] flex-1"
        />
        <AdminSelectFilter
          label="Status"
          value={filterStatus}
          onChange={(v) => setFilterStatus(v as FilterStatus)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
            { value: 'pinned', label: 'Pinned' },
          ]}
        />
        <AdminSortSelect
          value={sortBy}
          onChange={(v) => setSortBy(v as SortOption)}
          options={[
            { value: 'created_desc', label: 'Newest' },
            { value: 'created_asc', label: 'Oldest' },
            { value: 'published_desc', label: 'Recently Published' },
            { value: 'title', label: 'Title A-Z' },
          ]}
        />
      </AdminFilterBar>

      {!showForm ? (
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Announcement
        </Button>
      ) : (
        <Card hover={false} className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">
              {editingId ? 'Edit Announcement' : 'New Announcement'}
            </h3>
            <button
              onClick={resetForm}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement..."
                rows={4}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-violet-500"
                />
                <label htmlFor="isPinned" className="flex items-center gap-1 text-sm text-zinc-400">
                  Pin this announcement
                  <InfoTooltip content="Pinned announcements appear at the top" />
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <input
                  type="datetime-local"
                  value={scheduledDate ? scheduledDate.slice(0, 16) : ''}
                  onChange={(e) => setScheduledDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-300"
                />
                <InfoTooltip content="Schedule publish date (optional)" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => handleCreate(false)}
                disabled={submitting || !title.trim() || !content.trim()}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Edit2 className="mr-2 h-4 w-4" />
                )}
                Save Draft
              </Button>
              <Button
                onClick={() => handleCreate(true)}
                disabled={submitting || !title.trim() || !content.trim()}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {scheduledDate ? 'Schedule' : 'Publish Now'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {filteredAnnouncements.map((announcement, index) => {
          const isPublished = !!announcement.published_at
          
          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover={false} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {announcement.is_pinned && (
                        <Pin className="h-4 w-4 text-amber-400" />
                      )}
                      <h4 className="font-medium text-white">{announcement.title}</h4>
                      <span className={`rounded px-2 py-0.5 text-xs ${
                        isPublished 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-zinc-700 text-zinc-400'
                      }`}>
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                      {announcement.content}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                      <span>Created {new Date(announcement.created_at).toLocaleDateString()}</span>
                      {isPublished && (
                        <span>Published {new Date(announcement.published_at!).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(announcement)}
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTogglePin(announcement)}
                      title={announcement.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className={`h-4 w-4 ${announcement.is_pinned ? 'text-amber-400' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTogglePublish(announcement)}
                      title={isPublished ? 'Unpublish' : 'Publish'}
                    >
                      {isPublished ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4 text-green-400" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(announcement.id)}
                      disabled={deletingId === announcement.id}
                      title="Delete"
                    >
                      {deletingId === announcement.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}

        {filteredAnnouncements.length === 0 && (
          <Card hover={false} className="p-8">
            <div className="text-center text-zinc-500">
              {searchQuery || filterStatus !== 'all' 
                ? 'No announcements match your filters'
                : 'No announcements yet. Create your first one!'
              }
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
