'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  CreditCard, Loader2, Package, Calendar, DollarSign,
  ArrowUpRight, ArrowDownLeft, CheckCircle, Clock, AlertCircle,
  ExternalLink, Shield
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Card, Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import type { Transaction } from '@/types'

const STATUS_CONFIG = {
  pending: { 
    label: 'Pending', 
    color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    icon: Clock
  },
  processing: { 
    label: 'In Escrow', 
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: Shield
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: CheckCircle
  },
  refunded: { 
    label: 'Refunded', 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: ArrowDownLeft
  },
  disputed: { 
    label: 'Disputed', 
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: AlertCircle
  },
  failed: { 
    label: 'Failed', 
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: AlertCircle
  },
}

interface TransactionWithDetails extends Transaction {
  listing: { id: string; title: string } | null
  buyer: { id: string; display_name: string | null; email: string } | null
  seller: { id: string; display_name: string | null; email: string } | null
}

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'purchases' | 'sales'>('all')
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
    loadTransactions()
  }, [searchParams])

  async function loadTransactions() {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    
    setCurrentUserId(user.id)

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        listing:listings(id, title),
        buyer:users!transactions_buyer_id_fkey(id, display_name, email),
        seller:users!transactions_seller_id_fkey(id, display_name, email)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTransactions(data as TransactionWithDetails[])
    }
    
    setLoading(false)
  }

  async function handleConfirmDelivery(transactionId: string) {
    try {
      const response = await fetch('/api/stripe/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      })

      if (response.ok) {
        loadTransactions()
      }
    } catch (error) {
      console.error('Failed to confirm delivery:', error)
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'purchases') return tx.buyer_id === currentUserId
    if (filter === 'sales') return tx.seller_id === currentUserId
    return true
  })

  const totalEarnings = transactions
    .filter(tx => tx.seller_id === currentUserId && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.seller_amount, 0)

  const totalSpent = transactions
    .filter(tx => tx.buyer_id === currentUserId && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const inEscrow = transactions
    .filter(tx => tx.status === 'processing')
    .reduce((sum, tx) => sum + tx.amount, 0)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Success Banner */}
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-green-500/30 bg-green-500/10 p-4"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-medium text-green-400">Payment Successful!</p>
                  <p className="text-sm text-green-300/80">
                    Funds are held in escrow. Remember to confirm delivery once you receive the product.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white">Transactions</h1>
            <p className="text-zinc-400">View your purchase and sale history</p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card hover={false} className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <ArrowDownLeft className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    ${(totalEarnings / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-zinc-400">Total Earnings</p>
                </div>
              </div>
            </Card>
            <Card hover={false} className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <ArrowUpRight className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    ${(totalSpent / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-zinc-400">Total Spent</p>
                </div>
              </div>
            </Card>
            <Card hover={false} className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <Shield className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    ${(inEscrow / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-zinc-400">In Escrow</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {(['all', 'purchases', 'sales'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <Card hover={false} className="p-12 text-center">
              <CreditCard className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
              <h3 className="mb-2 text-lg font-medium text-white">No transactions yet</h3>
              <p className="mb-4 text-zinc-400">
                Your purchases and sales will appear here.
              </p>
              <Link
                href="/listings"
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-500"
              >
                <Package className="h-4 w-4" />
                Browse Listings
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx, index) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  currentUserId={currentUserId}
                  index={index}
                  onConfirmDelivery={() => handleConfirmDelivery(tx.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function TransactionCard({ 
  transaction, 
  currentUserId, 
  index,
  onConfirmDelivery 
}: { 
  transaction: TransactionWithDetails
  currentUserId: string | null
  index: number
  onConfirmDelivery: () => void
}) {
  const isBuyer = transaction.buyer_id === currentUserId
  const config = STATUS_CONFIG[transaction.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
  const StatusIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card hover={true} className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`rounded-lg p-3 ${isBuyer ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              {isBuyer ? (
                <ArrowUpRight className="h-5 w-5 text-red-400" />
              ) : (
                <ArrowDownLeft className="h-5 w-5 text-green-400" />
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isBuyer ? 'text-red-400' : 'text-green-400'}`}>
                  {isBuyer ? 'Purchase' : 'Sale'}
                </span>
                <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${config.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </span>
              </div>
              
              <Link 
                href={`/listing/${transaction.listing_id}`}
                className="mt-1 block font-medium text-white hover:text-violet-400"
              >
                {transaction.listing?.title || 'Listing'}
              </Link>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(transaction.created_at).toLocaleDateString()}
                </span>
                <span>
                  {isBuyer ? 'From: ' : 'To: '}
                  {isBuyer 
                    ? (transaction.seller?.display_name || transaction.seller?.email?.split('@')[0])
                    : (transaction.buyer?.display_name || transaction.buyer?.email?.split('@')[0])
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className={`text-lg font-bold ${isBuyer ? 'text-red-400' : 'text-green-400'}`}>
              {isBuyer ? '-' : '+'}${((isBuyer ? transaction.amount : transaction.seller_amount) / 100).toFixed(2)}
            </p>
            
            {isBuyer && transaction.status === 'processing' && (
              <Button
                variant="secondary"
                onClick={onConfirmDelivery}
                className="mt-2 text-xs"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Confirm Delivery
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
