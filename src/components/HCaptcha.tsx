'use client'

import { useRef, useCallback, useState } from 'react'
import HCaptchaComponent from '@hcaptcha/react-hcaptcha'
import { Coins, Loader2, Zap } from 'lucide-react'
import { shouldRequireCaptcha, CAPTCHA_SITE_KEY } from '@/lib/captcha-config'
import { CAPTCHA_BYPASS_COST } from '@/lib/membership-config'

interface HCaptchaProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: (error: string) => void
  onBypass?: () => Promise<boolean>
  canBypass?: boolean
  currentPoints?: number
  showBypassOption?: boolean
  size?: 'normal' | 'compact' | 'invisible'
  theme?: 'light' | 'dark'
}

export function HCaptcha({ 
  onVerify, 
  onExpire, 
  onError,
  onBypass,
  canBypass = false,
  currentPoints = 0,
  showBypassOption = true,
  size = 'normal',
  theme = 'dark'
}: HCaptchaProps) {
  const captchaRef = useRef<HCaptchaComponent>(null)
  const [bypassLoading, setBypassLoading] = useState(false)
  const [showCaptcha, setShowCaptcha] = useState(!canBypass || !showBypassOption)

  const handleVerify = useCallback((token: string) => {
    onVerify(token)
  }, [onVerify])

  const handleExpire = useCallback(() => {
    onExpire?.()
  }, [onExpire])

  const handleError = useCallback((err: string) => {
    console.error('hCaptcha error:', err)
    onError?.(err)
  }, [onError])

  const handleBypassClick = async () => {
    if (!onBypass) return
    
    setBypassLoading(true)
    const success = await onBypass()
    setBypassLoading(false)
    
    if (!success) {
      setShowCaptcha(true)
    }
  }

  if (!shouldRequireCaptcha() || !CAPTCHA_SITE_KEY) {
    return null
  }

  if (showBypassOption && canBypass && !showCaptcha) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <p className="text-sm text-zinc-400">Verify you're human</p>
          
          <button
            onClick={handleBypassClick}
            disabled={bypassLoading}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {bypassLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Skip with {CAPTCHA_BYPASS_COST} points
          </button>
          
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Coins className="h-3 w-3" />
            <span>Your balance: {currentPoints} pts</span>
          </div>
          
          <button
            onClick={() => setShowCaptcha(true)}
            className="text-xs text-zinc-500 underline hover:text-zinc-400"
          >
            Or solve captcha instead
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <HCaptchaComponent
          ref={captchaRef}
          sitekey={CAPTCHA_SITE_KEY}
          onVerify={handleVerify}
          onExpire={handleExpire}
          onError={handleError}
          size={size}
          theme={theme}
        />
      </div>
      
      {showBypassOption && canBypass && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setShowCaptcha(false)
            }}
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
          >
            <Zap className="h-3 w-3" />
            Use points instead ({CAPTCHA_BYPASS_COST} pts)
          </button>
        </div>
      )}
    </div>
  )
}

export function useHCaptcha() {
  const captchaRef = useRef<HCaptchaComponent>(null)

  const execute = useCallback(async (): Promise<string | null> => {
    if (!captchaRef.current) return null
    
    try {
      const response = await captchaRef.current.execute({ async: true })
      return response?.response || null
    } catch (error) {
      console.error('hCaptcha execution failed:', error)
      return null
    }
  }, [])

  const reset = useCallback(() => {
    captchaRef.current?.resetCaptcha()
  }, [])

  return { captchaRef, execute, reset }
}

interface InvisibleHCaptchaProps {
  captchaRef: React.RefObject<HCaptchaComponent | null>
  onVerify: (token: string) => void
  onError?: (error: string) => void
}

export function InvisibleHCaptcha({ captchaRef, onVerify, onError }: InvisibleHCaptchaProps) {
  if (!shouldRequireCaptcha() || !CAPTCHA_SITE_KEY) {
    return null
  }

  return (
    <HCaptchaComponent
      ref={captchaRef}
      sitekey={CAPTCHA_SITE_KEY}
      size="invisible"
      onVerify={onVerify}
      onError={onError}
    />
  )
}
