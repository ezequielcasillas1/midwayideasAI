'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Send, Loader2, Lock, Handshake } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { HCaptcha } from '@/components/HCaptcha'
import { useCaptcha, useCaptchaBypass } from '@/hooks'
import { shouldRequireCaptcha } from '@/lib/captcha-config'
import { useCofounderRequest } from '../hooks/useCofounderRequest'
import { CofounderStatus } from './CofounderStatus'

export function CofounderRequestCard() {
  const { request, canRequest, loading, submitting, submitRequest } = useCofounderRequest()
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState('')
  const [captchaBypassed, setCaptchaBypassed] = useState(false)
  const { verifyToken } = useCaptcha()
  const { canBypass, handleBypass, currentPoints } = useCaptchaBypass()

  if (loading) {
    return (
      <Card hover={false} className="animate-pulse bg-zinc-800/50 p-6">
        <div className="h-32" />
      </Card>
    )
  }

  if (!canRequest) {
    return (
      <Card hover={false} className="p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-amber-500/10 p-4">
            <Lock className="h-8 w-8 text-amber-400" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">Co-founder Eligibility</h3>
          <p className="mb-4 max-w-md text-zinc-400">
            Become a Sovereign member to unlock the ability to request a partnership 
            conversation with the founder.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-amber-400">
            <Crown className="h-5 w-5" />
            <span className="font-medium">Sovereign tier required</span>
          </div>
        </div>
      </Card>
    )
  }

  if (request) {
    return (
      <Card hover={false} className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/10 p-3">
              <Handshake className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Partnership Request</h3>
              <p className="text-sm text-zinc-400">
                Submitted {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <CofounderStatus status={request.status} />
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
          <p className="text-sm font-medium text-zinc-400">Your Message</p>
          <p className="mt-2 text-white">{request.message || 'No message provided'}</p>
        </div>

        {request.status === 'pending' && (
          <p className="mt-4 text-sm text-zinc-500">
            Your request is being reviewed. The founder will reach out if interested in discussing further.
          </p>
        )}

        {request.status === 'in_discussion' && (
          <p className="mt-4 text-sm text-emerald-400">
            Great news! The founder is interested in discussing a partnership. 
            Expect to be contacted soon.
          </p>
        )}

        {request.status === 'approved' && (
          <div className="mt-4 rounded-lg bg-emerald-500/10 p-4 text-emerald-400">
            <p className="font-medium">Congratulations!</p>
            <p className="text-sm">Your partnership request has been approved. 
              Check your email for next steps.</p>
          </div>
        )}
      </Card>
    )
  }

  return (
    <Card hover={false} className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-violet-500/10 p-3">
          <Handshake className="h-6 w-6 text-violet-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Co-founder Eligibility</h3>
          <p className="text-sm text-zinc-400">
            As a Sovereign member, you can request a partnership discussion
          </p>
        </div>
      </div>

      {!showForm ? (
        <div className="text-center">
          <p className="mb-4 text-zinc-400">
            Interested in becoming a co-founder of MIDWAY? Submit a partnership request 
            to start a conversation with the founder.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Crown className="mr-2 h-4 w-4" />
            Request Partnership
          </Button>
        </div>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={async (e) => {
            e.preventDefault()
            setCaptchaError('')

            if (shouldRequireCaptcha() && !captchaToken && !captchaBypassed) {
              setCaptchaError('Please complete the captcha verification')
              return
            }

            if (shouldRequireCaptcha() && captchaToken && !captchaBypassed) {
              const isValid = await verifyToken(captchaToken)
              if (!isValid) {
                setCaptchaError('Captcha verification failed, please try again')
                setCaptchaToken(null)
                return
              }
            }

            await submitRequest(message)
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Why do you want to be a co-founder?
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about yourself, your experience, and why you'd be a great partner..."
              rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              required
            />
          </div>

          {shouldRequireCaptcha() && !captchaBypassed && (
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
              <HCaptcha
                onVerify={(token) => {
                  setCaptchaToken(token)
                  setCaptchaError('')
                }}
                onExpire={() => {
                  setCaptchaToken(null)
                  setCaptchaError('Captcha expired, please verify again')
                }}
                onError={(err) => setCaptchaError(`Captcha error: ${err}`)}
                onBypass={async () => {
                  const success = await handleBypass()
                  if (success) {
                    setCaptchaBypassed(true)
                    setCaptchaError('')
                  }
                  return success
                }}
                canBypass={canBypass}
                currentPoints={currentPoints}
                showBypassOption={true}
              />
              {captchaError && (
                <p className="mt-2 text-center text-sm text-red-400">{captchaError}</p>
              )}
              {captchaToken && (
                <p className="mt-2 text-center text-sm text-green-400">Verified</p>
              )}
            </div>
          )}
          
          {captchaBypassed && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-green-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">Verification bypassed with points</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !message.trim() || (shouldRequireCaptcha() && !captchaToken && !captchaBypassed)}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </motion.form>
      )}
    </Card>
  )
}
