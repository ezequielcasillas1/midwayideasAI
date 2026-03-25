'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'
import { toggleFeaturedListing } from '../services/listing-service'

interface FeaturedToggleProps {
  listingId: string
  isFeatured: boolean
  featuredUntil: string | null
  canFeature: boolean
  onToggle?: (isFeatured: boolean) => void
}

export function FeaturedToggle({
  listingId,
  isFeatured,
  featuredUntil,
  canFeature,
  onToggle
}: FeaturedToggleProps) {
  const [loading, setLoading] = useState(false)
  const [featured, setFeatured] = useState(isFeatured)

  const isExpired = featuredUntil && new Date(featuredUntil) < new Date()
  const isActive = featured && !isExpired

  const handleToggle = async () => {
    if (!canFeature || loading) return

    setLoading(true)
    const newState = !isActive
    
    const result = await toggleFeaturedListing(listingId, newState)
    
    if (result) {
      setFeatured(result.is_featured)
      onToggle?.(result.is_featured)
    }
    
    setLoading(false)
  }

  if (!canFeature) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">Featured Listings</span>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Upgrade to Baron or higher to feature your listings and appear at the top of search results.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className={`h-5 w-5 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
          <div>
            <span className="font-medium text-white">Feature this listing</span>
            {isActive && featuredUntil && (
              <p className="text-xs text-zinc-400">
                Featured until {new Date(featuredUntil).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle}
          disabled={loading}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            isActive ? 'bg-amber-500' : 'bg-zinc-700'
          }`}
        >
          <motion.div
            animate={{ x: isActive ? 20 : 2 }}
            className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
          />
          {loading && (
            <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />
          )}
        </motion.button>
      </div>
      <p className="mt-2 text-sm text-zinc-500">
        Featured listings appear at the top of browse results for 7 days.
      </p>
    </div>
  )
}
