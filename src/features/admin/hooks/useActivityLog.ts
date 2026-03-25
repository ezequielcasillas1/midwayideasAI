'use client'

import { useState, useEffect } from 'react'
import { getActivityLog } from '../services/admin-service'
import { USE_MOCK_DATA } from '@/lib/mockData'
import type { User } from '@/types'

export interface ActivityLogEntry {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string | null
  details: Record<string, unknown>
  created_at: string
  admin?: User
}

export function useActivityLog(limit: number = 100) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadActivityLog() {
    setLoading(true)
    setError(null)

    if (USE_MOCK_DATA) {
      const mockEntries: ActivityLogEntry[] = [
        {
          id: '1',
          admin_id: 'admin-1',
          action: 'update_cofounder_status',
          target_type: 'cofounder_request',
          target_id: 'req-1',
          details: { status: 'approved', adminNotes: 'Great candidate' },
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          admin: { id: 'admin-1', email: 'admin@midway.com', display_name: 'Admin User', avatar_url: null, created_at: '' }
        },
        {
          id: '2',
          admin_id: 'admin-1',
          action: 'toggle_listing_featured',
          target_type: 'listing',
          target_id: 'mock-001',
          details: { isFeatured: true },
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          admin: { id: 'admin-1', email: 'admin@midway.com', display_name: 'Admin User', avatar_url: null, created_at: '' }
        },
        {
          id: '3',
          admin_id: 'admin-1',
          action: 'create_announcement',
          target_type: 'announcement',
          target_id: 'ann-1',
          details: { title: 'Welcome to Midway!' },
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          admin: { id: 'admin-1', email: 'admin@midway.com', display_name: 'Admin User', avatar_url: null, created_at: '' }
        },
        {
          id: '4',
          admin_id: 'admin-1',
          action: 'update_user_tier',
          target_type: 'user',
          target_id: 'user-123',
          details: { tier: 'sovereign' },
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          admin: { id: 'admin-1', email: 'admin@midway.com', display_name: 'Admin User', avatar_url: null, created_at: '' }
        },
        {
          id: '5',
          admin_id: 'admin-1',
          action: 'adjust_user_points',
          target_type: 'user',
          target_id: 'user-456',
          details: { amount: 100, reason: 'Bonus for participation', newPoints: 350 },
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          admin: { id: 'admin-1', email: 'admin@midway.com', display_name: 'Admin User', avatar_url: null, created_at: '' }
        },
        {
          id: '6',
          admin_id: 'admin-1',
          action: 'remove_listing',
          target_type: 'listing',
          target_id: 'mock-005',
          details: { reason: 'Violated terms of service' },
          created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          admin: { id: 'admin-1', email: 'admin@midway.com', display_name: 'Admin User', avatar_url: null, created_at: '' }
        },
        {
          id: '7',
          admin_id: 'admin-1',
          action: 'update_announcement',
          target_type: 'announcement',
          target_id: 'ann-2',
          details: { is_pinned: true },
          created_at: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
          admin: { id: 'admin-1', email: 'admin@midway.com', display_name: 'Admin User', avatar_url: null, created_at: '' }
        },
        {
          id: '8',
          admin_id: 'admin-1',
          action: 'delete_announcement',
          target_type: 'announcement',
          target_id: 'ann-3',
          details: {},
          created_at: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
          admin: { id: 'admin-1', email: 'admin@midway.com', display_name: 'Admin User', avatar_url: null, created_at: '' }
        },
      ]
      setEntries(mockEntries)
      setLoading(false)
      return
    }

    try {
      const data = await getActivityLog(limit)
      setEntries(data)
    } catch (err) {
      setError('Failed to load activity log')
      console.error(err)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadActivityLog()
  }, [limit])

  return {
    entries,
    loading,
    error,
    refresh: loadActivityLog
  }
}
