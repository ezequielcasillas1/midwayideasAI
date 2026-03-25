'use client'

import { useState, useCallback, useRef } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'

interface CaptchaState {
  token: string | null
  verified: boolean
  loading: boolean
  error: string | null
}

export function useCaptcha() {
  const captchaRef = useRef<HCaptcha>(null)
  const [state, setState] = useState<CaptchaState>({
    token: null,
    verified: false,
    loading: false,
    error: null,
  })

  const onVerify = useCallback((token: string) => {
    setState({
      token,
      verified: true,
      loading: false,
      error: null,
    })
  }, [])

  const onExpire = useCallback(() => {
    setState({
      token: null,
      verified: false,
      loading: false,
      error: 'Captcha expired, please verify again',
    })
  }, [])

  const onError = useCallback((error: string) => {
    setState({
      token: null,
      verified: false,
      loading: false,
      error: `Captcha error: ${error}`,
    })
  }, [])

  const reset = useCallback(() => {
    captchaRef.current?.resetCaptcha()
    setState({
      token: null,
      verified: false,
      loading: false,
      error: null,
    })
  }, [])

  const execute = useCallback(async (): Promise<string | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await captchaRef.current?.execute({ async: true })
      const token = response?.response || null
      
      if (token) {
        setState({
          token,
          verified: true,
          loading: false,
          error: null,
        })
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to get captcha token',
        }))
      }
      
      return token
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Captcha execution failed',
      }))
      return null
    }
  }, [])

  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()
      return data.success === true
    } catch (error) {
      console.error('Captcha verification failed:', error)
      return false
    }
  }, [])

  return {
    captchaRef,
    token: state.token,
    verified: state.verified,
    loading: state.loading,
    error: state.error,
    onVerify,
    onExpire,
    onError,
    reset,
    execute,
    verifyToken,
  }
}

export async function verifyCaptchaToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/captcha/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('Captcha verification failed:', error)
    return false
  }
}
