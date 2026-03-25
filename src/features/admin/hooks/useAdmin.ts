'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { USE_MOCK_DATA, mockSovereignMembers, mockCofounderRequests, mockAnnouncements } from '@/lib/mockData'
import {
  isUserAdmin,
  getAdminStats,
  getAllSovereignUsers,
  getAllCofounderRequests,
  getAllAnnouncements,
  type AdminStats,
  type SovereignUser
} from '../services/admin-service'
import type { CofounderRequest, CommunityAnnouncement, User } from '@/types'

const mockAdminStats: AdminStats = {
  totalUsers: 156,
  totalListings: 89,
  totalSovereigns: 4,
  totalRevenue: 12500,
  pendingCofounderRequests: 1,
}

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const checkAdmin = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (USE_MOCK_DATA) {
      setIsAdmin(true)
      setStats(mockAdminStats)
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      const adminStatus = await isUserAdmin(user.id)
      setIsAdmin(adminStatus)

      if (adminStatus) {
        const statsData = await getAdminStats()
        setStats(statsData)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check admin status'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAdmin()
  }, [checkAdmin])

  return {
    isAdmin,
    stats,
    loading,
    error,
    refetch: checkAdmin
  }
}

export function useAdminSovereigns() {
  const [sovereigns, setSovereigns] = useState<SovereignUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSovereigns = useCallback(async () => {
    setLoading(true)
    if (USE_MOCK_DATA) {
      setSovereigns(mockSovereignMembers.map(m => ({
        user: { id: m.id, email: m.email, display_name: m.display_name, avatar_url: m.avatar_url, created_at: m.joined_at },
        membership: { points: Math.floor(Math.random() * 500) + 100, created_at: m.joined_at }
      })))
      setLoading(false)
      return
    }
    const data = await getAllSovereignUsers()
    setSovereigns(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSovereigns()
  }, [fetchSovereigns])

  return { sovereigns, loading, refetch: fetchSovereigns }
}

export function useAdminCofounderRequests() {
  const [requests, setRequests] = useState<(CofounderRequest & { user: User })[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    if (USE_MOCK_DATA) {
      setRequests(mockCofounderRequests)
      setLoading(false)
      return
    }
    const data = await getAllCofounderRequests()
    setRequests(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  return { requests, loading, refetch: fetchRequests }
}

export function useAdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    if (USE_MOCK_DATA) {
      setAnnouncements(mockAnnouncements)
      setLoading(false)
      return
    }
    const data = await getAllAnnouncements()
    setAnnouncements(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  return { announcements, loading, refetch: fetchAnnouncements }
}
