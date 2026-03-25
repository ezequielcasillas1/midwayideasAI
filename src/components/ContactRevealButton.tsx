'use client'

import { useState } from 'react'
import { Eye, Loader2, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui'
import { HCaptcha } from '@/components/HCaptcha'
import { useCaptcha, useCaptchaBypass } from '@/hooks'
import { shouldRequireCaptcha } from '@/lib/captcha-config'
import { expressInterest } from '@/features/prospects'

interface ContactRevealButtonProps {
  contactInfo: string
  contactType?: 'email' | 'phone' | 'other'
  onReveal?: () => void
  requireMembership?: boolean
  hasMembership?: boolean
  listingId?: string
}

/**
 * A button that reveals contact information after captcha verification.
 * Only requires captcha in production environment.
 * 
 * Usage:
 * <ContactRevealButton 
 *   contactInfo="seller@example.com"
 *   contactType="email"
 *   requireMembership={true}
 *   hasMembership={user?.membership !== 'free'}
 * />
 */
export function ContactRevealButton({
  contactInfo,
  contactType = 'email',
  onReveal,
  requireMembership = false,
  hasMembership = true,
  listingId,
}: ContactRevealButtonProps) {
  const [revealed, setRevealed] = useState(false)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const { verifyToken } = useCaptcha()
  const { canBypass, handleBypass, currentPoints } = useCaptchaBypass()

  if (requireMembership && !hasMembership) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
        <Lock className="h-4 w-4" />
        <span>Upgrade membership to view contact</span>
      </div>
    )
  }

  if (revealed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2">
        {contactType === 'email' && <Mail className="h-4 w-4 text-zinc-400" />}
        <span className="text-white">{contactInfo}</span>
      </div>
    )
  }

  const handleReveal = () => {
    if (shouldRequireCaptcha()) {
      setShowCaptcha(true)
    } else {
      setRevealed(true)
      onReveal?.()
    }
  }

  const handleCaptchaVerify = async (token: string) => {
    setVerifying(true)
    setError('')

    const isValid = await verifyToken(token)
    setVerifying(false)

    if (isValid) {
      await completeReveal()
    } else {
      setError('Verification failed, please try again')
    }
  }

  const handleCaptchaBypass = async () => {
    const success = await handleBypass()
    if (success) {
      await completeReveal()
    }
    return success
  }

  const completeReveal = async () => {
    setRevealed(true)
    setShowCaptcha(false)
    
    if (listingId) {
      await expressInterest(listingId, 'interest_button')
    }
    
    onReveal?.()
  }

  if (showCaptcha) {
    return (
      <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <p className="text-center text-sm text-zinc-400">
          Complete verification to reveal contact
        </p>
        <HCaptcha
          onVerify={handleCaptchaVerify}
          onExpire={() => setError('Captcha expired, please try again')}
          onError={(err) => setError(`Error: ${err}`)}
          onBypass={handleCaptchaBypass}
          canBypass={canBypass}
          currentPoints={currentPoints}
          showBypassOption={true}
        />
        {verifying && (
          <p className="text-center text-sm text-zinc-400">Verifying...</p>
        )}
        {error && (
          <p className="text-center text-sm text-red-400">{error}</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCaptcha(false)}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button variant="secondary" onClick={handleReveal}>
      <Eye className="mr-2 h-4 w-4" />
      Reveal Contact
    </Button>
  )
}
