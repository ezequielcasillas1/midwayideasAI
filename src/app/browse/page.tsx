'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navbar, FilterBar, ListingGrid } from '@/components'
import { useListings } from '@/hooks'
import type { ListingFilters } from '@/types'

export default function BrowsePage() {
  const [filters, setFilters] = useState<ListingFilters>({ sort: 'newest' })
  const { listings, loading } = useListings(filters)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
            Browse Projects
          </h1>
          <p className="text-lg text-zinc-400">
            Discover unfinished projects ready for a new owner
          </p>
        </motion.div>

        <FilterBar filters={filters} onFilterChange={setFilters} />

        <ListingGrid listings={listings} loading={loading} />

        {!loading && listings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-sm text-zinc-500"
          >
            Showing {listings.length} project{listings.length !== 1 ? 's' : ''}
          </motion.div>
        )}
      </main>
    </div>
  )
}
