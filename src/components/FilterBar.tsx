'use client'

import { Search, SlidersHorizontal, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Input, Select, Button, Badge } from '@/components/ui'
import type { ListingFilters, Category, SortOption } from '@/types'

interface FilterBarProps {
  filters: ListingFilters
  onFilterChange: (filters: ListingFilters) => void
}

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'webapp', label: 'Web App' },
  { value: 'website', label: 'Website' },
  { value: 'extension', label: 'Extension' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'game', label: 'Game' },
  { value: 'api', label: 'API' },
  { value: 'os', label: 'OS' },
  { value: 'other', label: 'Other' },
]

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'completion', label: 'Most Complete' },
]

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value })
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ 
      ...filters, 
      category: e.target.value as Category | undefined || undefined 
    })
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, sort: e.target.value as SortOption })
  }

  const clearFilters = () => {
    onFilterChange({ sort: 'newest' })
  }

  const activeFilterCount = [
    filters.category,
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    filters.minCompletion,
    filters.maxCompletion,
  ].filter(Boolean).length

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-3">
          <div className="w-40">
            <Select
              options={categoryOptions}
              value={filters.category || ''}
              onChange={handleCategoryChange}
            />
          </div>
          <div className="w-44">
            <Select
              options={sortOptions}
              value={filters.sort || 'newest'}
              onChange={handleSortChange}
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="relative"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-400">Price:</span>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ''}
                    onChange={(e) => onFilterChange({ 
                      ...filters, 
                      minPrice: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    className="w-24"
                  />
                  <span className="text-zinc-500">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ''}
                    onChange={(e) => onFilterChange({ 
                      ...filters, 
                      maxPrice: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    className="w-24"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-400">Completion:</span>
                  <Input
                    type="number"
                    placeholder="Min %"
                    value={filters.minCompletion || ''}
                    onChange={(e) => onFilterChange({ 
                      ...filters, 
                      minCompletion: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    className="w-20"
                  />
                  <span className="text-zinc-500">-</span>
                  <Input
                    type="number"
                    placeholder="Max %"
                    value={filters.maxCompletion || ''}
                    onChange={(e) => onFilterChange({ 
                      ...filters, 
                      maxCompletion: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    className="w-20"
                  />
                </div>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeFilterCount > 0 && !showAdvanced && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-400">Active filters:</span>
          {filters.category && (
            <Badge variant="primary">
              {categoryOptions.find(c => c.value === filters.category)?.label}
            </Badge>
          )}
          {filters.search && (
            <Badge variant="primary">
              Search: {filters.search}
            </Badge>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <Badge variant="primary">
              ${filters.minPrice || 0} - ${filters.maxPrice || '∞'}
            </Badge>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-violet-400 hover:text-violet-300"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
