'use client'

import { useState, useCallback } from 'react'
import { useMembership } from '@/features/membership/hooks/useMembership'
import { CAPTCHA_BYPASS_COST } from '@/lib/membership-config'

interface BypassState {
  bypassed: boolean
  loading: boolean
  error: string | null
}

export function useCaptchaBypass() {
  const { membership, refreshMembership } = useMembership()
  const [state, setState] = useState<BypassState>({
    bypassed: false,
    loading: false,
    error: null,
  })

  const currentPoints = membership?.points ?? 0
  const canBypass = currentPoints >= CAPTCHA_BYPASS_COST

  const handleBypass = useCallback(async (): Promise<boolean> => {
    if (!canBypass) {
      setState({
        bypassed: false,
        loading: false,
        error: `Need ${CAPTCHA_BYPASS_COST} points to bypass. You have ${currentPoints}.`,
      })
      return false
    }

    setState({ bypassed: false, loading: true, error: null })

    try {
      const response = await fetch('/api/points/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: CAPTCHA_BYPASS_COST,
          reason: 'Captcha bypass',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setState({ bypassed: true, loading: false, error: null })
        refreshMembership?.()
        return true
      } else {
        setState({
          bypassed: false,
          loading: false,
          error: data.error || 'Failed to process bypass',
        })
        return false
      }
    } catch (error) {
      setState({
        bypassed: false,
        loading: false,
        error: 'Network error during bypass',
      })
      return false
    }
  }, [canBypass, currentPoints, refreshMembership])

  const reset = useCallback(() => {
    setState({ bypassed: false, loading: false, error: null })
  }, [])

  return {
    canBypass,
    bypassCost: CAPTCHA_BYPASS_COST,
    currentPoints,
    bypassed: state.bypassed,
    loading: state.loading,
    error: state.error,
    handleBypass,
    reset,
  }
}
