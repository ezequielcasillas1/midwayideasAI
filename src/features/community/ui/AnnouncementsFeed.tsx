'use client'

import { motion } from 'framer-motion'
import { Megaphone, Pin, Calendar } from 'lucide-react'
import { Card } from '@/components/ui'
import type { CommunityAnnouncement } from '@/types'

interface AnnouncementsFeedProps {
  announcements: CommunityAnnouncement[]
  onAnnouncementClick?: (id: string) => void
}

export function AnnouncementsFeed({ 
  announcements, 
  onAnnouncementClick 
}: AnnouncementsFeedProps) {
  if (announcements.length === 0) {
    return (
      <Card hover={false} className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Megaphone className="mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-zinc-500">No announcements yet</p>
          <p className="text-sm text-zinc-600">
            Check back later for updates from the founder
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-white">Announcements</h3>
      </div>

      {announcements.map((announcement, index) => (
        <motion.div
          key={announcement.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onAnnouncementClick?.(announcement.id)}
          className="cursor-pointer"
        >
          <Card 
            hover 
            className={`p-5 ${announcement.is_pinned ? 'border-amber-500/30' : ''}`}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                {announcement.is_pinned && (
                  <div className="rounded bg-amber-500/10 p-1">
                    <Pin className="h-4 w-4 text-amber-400" />
                  </div>
                )}
                <h4 className="font-semibold text-white">{announcement.title}</h4>
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Calendar className="h-3 w-3" />
                {new Date(announcement.published_at!).toLocaleDateString()}
              </div>
            </div>
            <p className="line-clamp-3 text-sm text-zinc-400">
              {announcement.content}
            </p>
            {announcement.author && (
              <div className="mt-3 flex items-center gap-2 border-t border-zinc-800 pt-3">
                <div className="h-6 w-6 rounded-full bg-violet-500/20 p-1">
                  <Megaphone className="h-4 w-4 text-violet-400" />
                </div>
                <span className="text-xs text-zinc-500">
                  Posted by {announcement.author.display_name || 'Admin'}
                </span>
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
