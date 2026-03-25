'use client'

import { useState, type ReactNode, type FormEvent } from 'react'
import { HCaptcha } from './HCaptcha'
import { verifyCaptchaToken } from '@/hooks/useCaptcha'
import { shouldRequireCaptcha } from '@/lib/captcha-config'

interface CaptchaProtectedFormProps {
  children: ReactNode
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>
  requireCaptcha?: boolean
  captchaPosition?: 'before-submit' | 'after-fields'
  className?: string
  submitButtonId?: string
}

export function CaptchaProtectedForm({
  children,
  onSubmit,
  requireCaptcha = true,
  captchaPosition = 'before-submit',
  className = '',
  submitButtonId,
}: CaptchaProtectedFormProps) {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token)
    setCaptchaError(null)
  }

  const handleCaptchaExpire = () => {
    setCaptchaToken(null)
    setCaptchaError('Captcha expired, please verify again')
  }

  const handleCaptchaError = (error: string) => {
    setCaptchaToken(null)
    setCaptchaError(`Captcha error: ${error}`)
  }

  const captchaRequired = requireCaptcha && shouldRequireCaptcha()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (captchaRequired && !captchaToken) {
      setCaptchaError('Please complete the captcha verification')
      return
    }

    if (captchaRequired && captchaToken) {
      setVerifying(true)
      const isValid = await verifyCaptchaToken(captchaToken)
      setVerifying(false)

      if (!isValid) {
        setCaptchaError('Captcha verification failed, please try again')
        setCaptchaToken(null)
        return
      }
    }

    await onSubmit(e)
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
      
      {captchaRequired && (
        <div className="mt-4">
          <HCaptcha
            onVerify={handleCaptchaVerify}
            onExpire={handleCaptchaExpire}
            onError={handleCaptchaError}
          />
          
          {captchaError && (
            <p className="mt-2 text-sm text-red-400">{captchaError}</p>
          )}
          
          {verifying && (
            <p className="mt-2 text-sm text-zinc-400">Verifying...</p>
          )}
        </div>
      )}
    </form>
  )
}

interface CaptchaGateProps {
  children: ReactNode
  onVerified: () => void
  title?: string
  description?: string
}

export function CaptchaGate({
  children,
  onVerified,
  title = 'Verify you are human',
  description = 'Please complete the captcha to continue',
}: CaptchaGateProps) {
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async (token: string) => {
    setVerifying(true)
    setError(null)

    const isValid = await verifyCaptchaToken(token)
    
    setVerifying(false)

    if (isValid) {
      setVerified(true)
      onVerified()
    } else {
      setError('Verification failed, please try again')
    }
  }

  const captchaRequired = shouldRequireCaptcha()

  if (verified || !captchaRequired) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-white">{title}</h3>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>

      <HCaptcha
        onVerify={handleVerify}
        onError={(err) => setError(`Error: ${err}`)}
      />

      {verifying && (
        <p className="text-sm text-zinc-400">Verifying...</p>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
