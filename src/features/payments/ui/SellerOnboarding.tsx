'use client'

import { useState, useEffect } from 'react'
import { 
  CreditCard, ExternalLink, CheckCircle, AlertCircle, 
  Loader2, ArrowRight, RefreshCw
} from 'lucide-react'
import { Card, Button } from '@/components/ui'

interface ConnectStatus {
  hasAccount: boolean
  accountId?: string
  onboardingComplete: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted?: boolean
}

export function SellerOnboarding() {
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboarding, setOnboarding] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/connect')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to load connect status:', error)
    }
    setLoading(false)
  }

  async function startOnboarding() {
    setOnboarding(true)
    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        }
      }
    } catch (error) {
      console.error('Onboarding error:', error)
    }
    setOnboarding(false)
  }

  if (loading) {
    return (
      <Card hover={false} className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      </Card>
    )
  }

  if (!status?.hasAccount) {
    return (
      <Card hover={false} className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-violet-500/10 p-3">
            <CreditCard className="h-6 w-6 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Enable Payments</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Connect your bank account to receive payments from buyers. 
              Powered by Stripe for secure transactions.
            </p>
            
            <div className="mt-4 space-y-2 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Secure payouts to your bank</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Buyer protection with escrow</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>5% platform fee per transaction</span>
              </div>
            </div>

            <Button
              onClick={startOnboarding}
              disabled={onboarding}
              className="mt-4"
            >
              {onboarding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Get Started
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (!status.onboardingComplete) {
    return (
      <Card hover={false} className="border-amber-500/30 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-amber-500/10 p-3">
            <AlertCircle className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Complete Your Setup</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Your payment account needs additional information before you can receive payments.
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <StatusItem 
                label="Account Created" 
                complete={true} 
              />
              <StatusItem 
                label="Details Submitted" 
                complete={status.detailsSubmitted || false} 
              />
              <StatusItem 
                label="Charges Enabled" 
                complete={status.chargesEnabled} 
              />
              <StatusItem 
                label="Payouts Enabled" 
                complete={status.payoutsEnabled} 
              />
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={startOnboarding}
                disabled={onboarding}
              >
                {onboarding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Continue Setup
              </Button>
              <Button
                variant="secondary"
                onClick={loadStatus}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card hover={false} className="border-green-500/30 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-green-500/10 p-3">
          <CheckCircle className="h-6 w-6 text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Payments Enabled</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Your account is fully set up. You can now receive payments from buyers.
          </p>

          <div className="mt-4 space-y-2 text-sm">
            <StatusItem label="Account Verified" complete={true} />
            <StatusItem label="Charges Enabled" complete={true} />
            <StatusItem label="Payouts Enabled" complete={true} />
          </div>

          <div className="mt-4 flex gap-2">
            <a
              href="https://dashboard.stripe.com/connect/accounts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
            >
              <ExternalLink className="h-4 w-4" />
              Stripe Dashboard
            </a>
            <Button
              variant="secondary"
              onClick={loadStatus}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function StatusItem({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {complete ? (
        <CheckCircle className="h-4 w-4 text-green-400" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-zinc-600" />
      )}
      <span className={complete ? 'text-zinc-300' : 'text-zinc-500'}>
        {label}
      </span>
    </div>
  )
}
