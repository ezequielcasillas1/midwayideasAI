'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthState {
  user: SupabaseUser | null
  loading: boolean
}

export function useAuth() {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, loading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ user: session?.user ?? null, loading: false })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data
  }, [])

  const signup = useCallback(async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })
    
    if (error) throw error

    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        display_name: displayName || null,
        avatar_url: null,
      })
    }
    
    return data
  }, [])

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/')
  }, [router])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  }, [])

  return {
    user: state.user,
    loading: state.loading,
    login,
    signup,
    logout,
    resetPassword,
  }
}
