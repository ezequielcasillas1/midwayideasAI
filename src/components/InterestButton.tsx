'use client'

import { useState, useEffect } from 'react'
import { Heart, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui'
import { HCaptcha } from '@/components/HCaptcha'
import { useCaptchaBypass, useCaptcha } from '@/hooks'
import { useMembership } from '@/features/membership/hooks/useMembership'
import { expressInterest, hasExpressedInterest } from '@/features/prospects'
import { shouldRequireCaptcha } from '@/lib/captcha-config'

interface InterestButtonProps {
  listingId: string
  className?: string
  variant?: 'default' | 'compact'
  onSuccess?: () => void
}

export function InterestButton({ 
  listingId, 
  className = '',
  variant = 'default',
  onSuccess 
}: InterestButtonProps) {
  const [loading, setLoading] = useState(false)
  const [interested, setInterested] = useState(false)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { membership } = useMembership()
  const { canBypass, handleBypass, currentPoints } = useCaptchaBypass()
  const { onVerify, verified, reset: resetCaptcha } = useCaptcha()

  useEffect(() => {
    checkExistingInterest()
  }, [listingId])

  async function checkExistingInterest() {
    const exists = await hasExpressedInterest(listingId)
    setInterested(exists)
  }

  async function handleInterestClick() {
    if (interested) return

    if (shouldRequireCaptcha() && !verified) {
      setShowCaptcha(true)
      return
    }

    await submitInterest()
  }

  async function submitInterest() {
    setLoading(true)
    setError(null)

    const result = await expressInterest(listingId, 'interest_button')

    if (result.success) {
      setInterested(true)
      setShowCaptcha(false)
      resetCaptcha()
      onSuccess?.()
    } else {
      setError(result.error || 'Failed to express interest')
    }

    setLoading(false)
  }

  async function handleCaptchaVerify(token: string) {
    onVerify(token)
    await submitInterest()
  }

  async function handleBypassClick() {
    const success = await handleBypass()
    if (success) {
      await submitInterest()
    }
  }

  if (interested) {
    return (
      <Button
        variant="secondary"
        disabled
        className={`${className} cursor-default`}
      >
        <Check className="mr-2 h-4 w-4 text-green-400" />
        {variant === 'compact' ? 'Interested' : 'Interest Expressed'}
      </Button>
    )
  }

  if (showCaptcha && shouldRequireCaptcha()) {
    return (
      <div className="space-y-3">
        <HCaptcha
          onVerify={handleCaptchaVerify}
          onBypass={handleBypassClick}
          canBypass={canBypass}
          currentPoints={currentPoints}
          showBypassOption={true}
        />
        <button
          onClick={() => setShowCaptcha(false)}
          className="text-sm text-zinc-500 hover:text-zinc-400"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div>
      <Button
        onClick={handleInterestClick}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Heart className="mr-2 h-4 w-4" />
        )}
        {variant === 'compact' ? "I'm Interested" : "Express Interest"}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
