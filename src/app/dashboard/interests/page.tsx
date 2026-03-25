'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Heart, Loader2, ExternalLink, Calendar, DollarSign,
  MessageSquare, CheckCircle, Clock, Package
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui'
import { getMyInterests, type ProspectWithDetails } from '@/features/prospects'

const STATUS_CONFIG = {
  interested: { 
    label: 'Waiting', 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Clock,
    description: 'Seller has been notified'
  },
  contacted: { 
    label: 'In Contact', 
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: MessageSquare,
    description: 'Seller has reached out'
  },
  converted: { 
    label: 'Completed', 
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: CheckCircle,
    description: 'Deal completed'
  },
}

export default function MyInterestsPage() {
  const [interests, setInterests] = useState<ProspectWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInterests()
  }, [])

  async function loadInterests() {
    setLoading(true)
    const data = await getMyInterests()
    setInterests(data)
    setLoading(false)
  }

  const activeCount = interests.filter(i => i.status !== 'converted').length
  const completedCount = interests.filter(i => i.status === 'converted').length

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white">My Interests</h1>
            <p className="text-zinc-400">Listings you've expressed interest in</p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card hover={false} className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-500/10 p-2">
                  <Heart className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{interests.length}</p>
                  <p className="text-sm text-zinc-400">Total Interests</p>
                </div>
              </div>
            </Card>
            <Card hover={false} className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{activeCount}</p>
                  <p className="text-sm text-zinc-400">Active</p>
                </div>
              </div>
            </Card>
            <Card hover={false} className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{completedCount}</p>
                  <p className="text-sm text-zinc-400">Completed</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Interests List */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : interests.length === 0 ? (
            <Card hover={false} className="p-12 text-center">
              <Heart className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
              <h3 className="mb-2 text-lg font-medium text-white">No interests yet</h3>
              <p className="mb-4 text-zinc-400">
                When you express interest in a listing, it will appear here.
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
              {interests.map((interest, index) => (
                <InterestCard key={interest.id} interest={interest} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function InterestCard({ interest, index }: { 
  interest: ProspectWithDetails
  index: number 
}) {
  const config = STATUS_CONFIG[interest.status]
  const StatusIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card hover={true} className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                <Package className="h-6 w-6 text-zinc-400" />
              </div>
              
              <div className="min-w-0">
                <Link 
                  href={`/listing/${interest.listing_id}`}
                  className="group flex items-center gap-2"
                >
                  <h3 className="font-medium text-white group-hover:text-violet-400">
                    {interest.listing?.title || 'Listing'}
                  </h3>
                  <ExternalLink className="h-4 w-4 text-zinc-500 group-hover:text-violet-400" />
                </Link>
                
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    ${interest.listing?.price?.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(interest.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs ${config.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                  <span className="text-xs text-zinc-500">{config.description}</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            href={`/listing/${interest.listing_id}`}
            className="shrink-0 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white hover:bg-zinc-700"
          >
            View Listing
          </Link>
        </div>
      </Card>
    </motion.div>
  )
}
