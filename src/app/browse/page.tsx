'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Navbar, FilterBar, ListingGrid, Pagination } from '@/components'
import { useListings, ITEMS_PER_PAGE } from '@/hooks'
import type { ListingFilters } from '@/types'

export default function BrowsePage() {
  const [filters, setFilters] = useState<ListingFilters>({ sort: 'newest', page: 0 })
  const { listings, loading, totalCount, totalPages } = useListings(filters)

  const handleFilterChange = useCallback((newFilters: ListingFilters) => {
    setFilters({ ...newFilters, page: 0 })
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

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

        <FilterBar filters={filters} onFilterChange={handleFilterChange} />

        <ListingGrid listings={listings} loading={loading} />

        {!loading && listings.length > 0 && (
          <>
            <Pagination
              currentPage={filters.page || 0}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-center text-sm text-zinc-500"
            >
              Showing {(filters.page || 0) * ITEMS_PER_PAGE + 1}-
              {Math.min(((filters.page || 0) + 1) * ITEMS_PER_PAGE, totalCount)} of {totalCount} project
              {totalCount !== 1 ? 's' : ''}
            </motion.div>
          </>
        )}
      </main>
    </div>
  )
}
