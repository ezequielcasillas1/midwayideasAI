'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { User } from '@/types'

export function useUser() {
  const { user: authUser, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!authUser) {
      setProfile(null)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        setProfile(null)
      } else {
        setProfile(data)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [authUser, authLoading])

  const updateProfile = async (updates: Partial<Pick<User, 'display_name' | 'avatar_url'>>) => {
    if (!authUser) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', authUser.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)
    return data
  }

  return {
    profile,
    loading: authLoading || loading,
    updateProfile,
  }
}
