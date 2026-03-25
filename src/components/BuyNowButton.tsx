'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { 
  Elements, 
  PaymentElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js'
import { ShoppingCart, Loader2, X, Shield, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { PLATFORM_FEE_PERCENT } from '@/lib/payment-config'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface BuyNowButtonProps {
  listingId: string
  listingTitle: string
  price: number
  sellerHasPayments: boolean
  className?: string
}

export function BuyNowButton({ 
  listingId, 
  listingTitle, 
  price, 
  sellerHasPayments,
  className = '' 
}: BuyNowButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleBuyClick() {
    if (!sellerHasPayments) {
      setError('This seller has not enabled payments yet.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to start payment')
        setLoading(false)
        return
      }

      setClientSecret(data.clientSecret)
      setTransactionId(data.transactionId)
      setShowModal(true)
    } catch (err) {
      setError('Network error. Please try again.')
    }
    
    setLoading(false)
  }

  function closeModal() {
    setShowModal(false)
    setClientSecret(null)
    setTransactionId(null)
  }

  return (
    <>
      <Button
        onClick={handleBuyClick}
        disabled={loading || !sellerHasPayments}
        className={className}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="mr-2 h-4 w-4" />
        )}
        Buy Now - ${price.toLocaleString()}
      </Button>

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}

      {!sellerHasPayments && (
        <p className="mt-2 text-xs text-zinc-500">
          Seller has not enabled payments
        </p>
      )}

      {showModal && clientSecret && (
        <PaymentModal
          clientSecret={clientSecret}
          listingTitle={listingTitle}
          price={price}
          transactionId={transactionId}
          onClose={closeModal}
        />
      )}
    </>
  )
}

interface PaymentModalProps {
  clientSecret: string
  listingTitle: string
  price: number
  transactionId: string | null
  onClose: () => void
}

function PaymentModal({ 
  clientSecret, 
  listingTitle, 
  price, 
  transactionId,
  onClose 
}: PaymentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h2 className="text-lg font-semibold text-white">Complete Purchase</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
            <p className="text-sm text-zinc-400">Purchasing</p>
            <p className="font-medium text-white">{listingTitle}</p>
            <p className="mt-2 text-2xl font-bold text-white">
              ${price.toLocaleString()}
            </p>
          </div>

          <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
            <div className="text-sm text-green-300">
              <p className="font-medium">Buyer Protection</p>
              <p className="text-green-400/80">
                Funds are held in escrow until you confirm delivery.
              </p>
            </div>
          </div>

          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm 
              price={price} 
              transactionId={transactionId}
              onClose={onClose} 
            />
          </Elements>
        </div>
      </div>
    </div>
  )
}

interface CheckoutFormProps {
  price: number
  transactionId: string | null
  onClose: () => void
}

function CheckoutForm({ price, transactionId, onClose }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/transactions?success=true&transaction=${transactionId}`,
      },
      redirect: 'if_required',
    })

    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Payment Successful!</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Funds are now held in escrow. The seller will be notified.
        </p>
        <Button onClick={onClose} className="mt-4">
          Done
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement 
        options={{
          layout: 'tabs',
        }}
      />
      
      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}

      <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4 text-sm text-zinc-400">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="text-white">${price.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
          <span>Included</span>
        </div>
        <div className="flex justify-between border-t border-zinc-800 pt-2 font-medium text-white">
          <span>Total</span>
          <span>${price.toLocaleString()}</span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="mt-4 w-full"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="mr-2 h-4 w-4" />
        )}
        Pay ${price.toLocaleString()}
      </Button>
    </form>
  )
}
