'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { USE_MOCK_DATA } from '@/lib/mockData'
import {
  getCofounderRequest,
  createCofounderRequest,
  updateCofounderRequest,
  canRequestCofounder
} from '../services/cofounder-service'
import type { CofounderRequest } from '@/types'

export function useCofounderRequest() {
  const [request, setRequest] = useState<CofounderRequest | null>(null)
  const [canRequest, setCanRequest] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchRequest = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (USE_MOCK_DATA) {
      setCanRequest(true)
      setRequest(null)
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setCanRequest(false)
        setLoading(false)
        return
      }

      const [eligible, existingRequest] = await Promise.all([
        canRequestCofounder(user.id),
        getCofounderRequest(user.id)
      ])

      setCanRequest(eligible)
      setRequest(existingRequest)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch request'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequest()
  }, [fetchRequest])

  const submitRequest = async (message: string) => {
    setSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const result = await createCofounderRequest(user.id, message)
      if (result) {
        setRequest(result)
      } else {
        throw new Error('Failed to submit request')
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit request'))
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const updateMessage = async (message: string) => {
    if (!request) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await updateCofounderRequest(request.id, { message })
      if (result) {
        setRequest(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update request'))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    request,
    canRequest,
    loading,
    submitting,
    error,
    submitRequest,
    updateMessage,
    refetch: fetchRequest
  }
}
