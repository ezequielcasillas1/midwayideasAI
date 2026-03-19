'use client'

import { motion } from 'framer-motion'
import { Loader2, PackageOpen } from 'lucide-react'
import { ListingCard } from './ListingCard'
import type { Listing } from '@/types'

interface ListingGridProps {
  listings: Listing[]
  loading?: boolean
}

export function ListingGrid({ listings, loading }: ListingGridProps) {
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="h-8 w-8 text-violet-500" />
        </motion.div>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[400px] flex-col items-center justify-center text-center"
      >
        <div className="mb-4 rounded-2xl bg-zinc-800/50 p-6">
          <PackageOpen className="h-12 w-12 text-zinc-500" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-white">No listings found</h3>
        <p className="max-w-sm text-zinc-400">
          Try adjusting your filters or check back later for new projects.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing, index) => (
        <ListingCard key={listing.id} listing={listing} index={index} />
      ))}
    </div>
  )
}
