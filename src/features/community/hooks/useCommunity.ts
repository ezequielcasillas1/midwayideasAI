'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { USE_MOCK_DATA, mockAnnouncements, mockSovereignMembers } from '@/lib/mockData'
import {
  getPublishedAnnouncements,
  getSovereignMembers,
  canAccessCommunity,
  markAnnouncementAsRead,
  type SovereignMember
} from '../services/community-service'
import type { CommunityAnnouncement } from '@/types'

export function useCommunity() {
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>([])
  const [members, setMembers] = useState<SovereignMember[]>([])
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCommunityData = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (USE_MOCK_DATA) {
      setHasAccess(true)
      setAnnouncements(mockAnnouncements)
      setMembers(mockSovereignMembers)
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      const access = await canAccessCommunity(user.id)
      setHasAccess(access)

      if (!access) {
        setLoading(false)
        return
      }

      const [announcementsData, membersData] = await Promise.all([
        getPublishedAnnouncements(),
        getSovereignMembers()
      ])

      setAnnouncements(announcementsData)
      setMembers(membersData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch community data'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCommunityData()
  }, [fetchCommunityData])

  const markAsRead = async (announcementId: string) => {
    if (USE_MOCK_DATA) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await markAnnouncementAsRead(announcementId, user.id)
    }
  }

  return {
    announcements,
    members,
    hasAccess,
    loading,
    error,
    markAsRead,
    refetch: fetchCommunityData
  }
}
