'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pin, Send, Trash2, Edit2, Loader2, X } from 'lucide-react'
import { Button, Card } from '@/components/ui'
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

export function AnnouncementsManager({ announcements, onUpdate }: AnnouncementsManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = async (publish: boolean) => {
    if (!title.trim() || !content.trim()) return

    setSubmitting(true)
    const result = await createAnnouncement(title, content, isPinned, publish)
    
    if (result) {
      setTitle('')
      setContent('')
      setIsPinned(false)
      setShowForm(false)
      onUpdate()
    }
    setSubmitting(false)
  }

  const handleTogglePublish = async (announcement: CommunityAnnouncement) => {
    const isPublished = !!announcement.published_at
    await updateAnnouncement(announcement.id, {
      published_at: isPublished ? null : new Date().toISOString()
    })
    onUpdate()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const success = await deleteAnnouncement(id)
    if (success) {
      onUpdate()
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Announcement
        </Button>
      ) : (
        <Card hover={false} className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">New Announcement</h3>
            <button
              onClick={() => setShowForm(false)}
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-violet-500"
              />
              <label htmlFor="isPinned" className="text-sm text-zinc-400">
                Pin this announcement
              </label>
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
                Publish Now
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {announcements.map((announcement, index) => {
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
                    <div className="flex items-center gap-2">
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
                    <p className="mt-2 text-xs text-zinc-500">
                      Created {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTogglePublish(announcement)}
                    >
                      {isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(announcement.id)}
                      disabled={deletingId === announcement.id}
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

        {announcements.length === 0 && (
          <Card hover={false} className="p-8">
            <div className="text-center text-zinc-500">
              No announcements yet. Create your first one!
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
