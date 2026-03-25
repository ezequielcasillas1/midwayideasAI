'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, Star, User, DollarSign, Loader2, Eye, ExternalLink, 
  Ban, CheckCircle, AlertTriangle 
} from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { AdminSearchBar } from './AdminSearchBar'
import { AdminSelectFilter, AdminFilterBar, AdminSortSelect } from './AdminFilters'
import { ExportButton } from './ExportButton'
import { ListingDetailModal } from './ListingDetailModal'
import { UserDetailModal } from './UserDetailModal'
import { AdminModal } from './AdminModal'
import { getAllListings, toggleListingFeatured, banListing, unbanListing } from '../services/admin-service'
import { exportAllListings } from '../services/export-service'
import { USE_MOCK_DATA, mockListings } from '@/lib/mockData'
import type { User as UserType } from '@/types'

interface ListingWithSeller {
  id: string
  title: string
  description?: string
  status: string
  category: string
  price: number
  is_featured: boolean
  featured_until?: string | null
  seller_id: string
  seller: UserType | null
  created_at: string
  ban_reason?: string | null
}

type FilterStatus = 'all' | 'active' | 'sold' | 'draft' | 'banned'
type FilterFeatured = 'all' | 'featured' | 'not_featured'
type SortOption = 'created_desc' | 'created_asc' | 'price_high' | 'price_low' | 'title'

export function ListingsManager() {
  const [listings, setListings] = useState<ListingWithSeller[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterFeatured, setFilterFeatured] = useState<FilterFeatured>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('created_desc')
  
  const [selectedListing, setSelectedListing] = useState<ListingWithSeller | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null)
  
  const [banModalListing, setBanModalListing] = useState<ListingWithSeller | null>(null)
  const [banReason, setBanReason] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadListings()
  }, [])

  async function loadListings() {
    setLoading(true)
    
    if (USE_MOCK_DATA) {
      const mockData: ListingWithSeller[] = mockListings.map((l, i) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        status: i === 2 ? 'banned' : l.status,
        category: l.category,
        price: l.price,
        is_featured: l.is_featured || false,
        featured_until: l.featured_until,
        seller_id: l.seller_id,
        seller: {
          id: l.seller_id,
          email: 'seller@example.com',
          display_name: l.seller?.display_name || 'Unknown Seller',
          avatar_url: l.seller?.avatar_url || null,
          created_at: new Date().toISOString()
        },
        created_at: l.created_at,
        ban_reason: i === 2 ? 'Violated terms of service' : null
      }))
      setListings(mockData)
      setLoading(false)
      return
    }

    const data = await getAllListings()
    setListings(data.map(l => ({
      ...l,
      description: undefined,
      featured_until: undefined,
      ban_reason: null
    })))
    setLoading(false)
  }

  const categories = useMemo(() => {
    const cats = new Set(listings.map(l => l.category))
    return ['all', ...Array.from(cats)]
  }, [listings])

  const filteredListings = useMemo(() => {
    let result = [...listings]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(l => 
        l.title.toLowerCase().includes(query) ||
        l.seller?.display_name?.toLowerCase().includes(query) ||
        l.seller?.email?.toLowerCase().includes(query)
      )
    }
    
    if (filterStatus !== 'all') {
      result = result.filter(l => l.status === filterStatus)
    }
    
    if (filterFeatured !== 'all') {
      result = result.filter(l => filterFeatured === 'featured' ? l.is_featured : !l.is_featured)
    }
    
    if (filterCategory !== 'all') {
      result = result.filter(l => l.category === filterCategory)
    }
    
    result.sort((a, b) => {
      if (sortBy === 'created_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'created_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'price_high') return b.price - a.price
      if (sortBy === 'price_low') return a.price - b.price
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      return 0
    })
    
    return result
  }, [listings, searchQuery, filterStatus, filterFeatured, filterCategory, sortBy])

  async function handleQuickToggleFeatured(listing: ListingWithSeller, e: React.MouseEvent) {
    e.stopPropagation()
    setTogglingFeatured(listing.id)
    
    const success = await toggleListingFeatured(listing.id, !listing.is_featured)
    if (success) {
      setListings(prev => prev.map(l => 
        l.id === listing.id 
          ? { ...l, is_featured: !l.is_featured, featured_until: !l.is_featured ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null }
          : l
      ))
    }
    setTogglingFeatured(null)
  }

  async function handleBan() {
    if (!banModalListing || !banReason.trim()) return
    
    setProcessing(banModalListing.id)
    const success = await banListing(banModalListing.id, banReason.trim())
    if (success) {
      setListings(prev => prev.map(l => 
        l.id === banModalListing.id 
          ? { ...l, status: 'banned', ban_reason: banReason.trim() }
          : l
      ))
      setBanModalListing(null)
      setBanReason('')
    }
    setProcessing(null)
  }

  async function handleUnban(listing: ListingWithSeller, e: React.MouseEvent) {
    e.stopPropagation()
    setProcessing(listing.id)
    const success = await unbanListing(listing.id)
    if (success) {
      setListings(prev => prev.map(l => 
        l.id === listing.id 
          ? { ...l, status: 'active', ban_reason: null }
          : l
      ))
    }
    setProcessing(null)
  }

  function handleViewUser(userId: string, userName?: string) {
    setSelectedUserId(userId)
    setSelectedUserName(userName || '')
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    sold: 'bg-blue-500/20 text-blue-400',
    draft: 'bg-zinc-700 text-zinc-400',
    banned: 'bg-red-500/20 text-red-400'
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AdminFilterBar>
        <AdminSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by title or seller..."
          className="min-w-[200px] flex-1"
        />
        <AdminSelectFilter
          label="Status"
          value={filterStatus}
          onChange={(v) => setFilterStatus(v as FilterStatus)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'sold', label: 'Sold' },
            { value: 'draft', label: 'Draft' },
            { value: 'banned', label: 'Banned' },
          ]}
        />
        <AdminSelectFilter
          label="Featured"
          value={filterFeatured}
          onChange={(v) => setFilterFeatured(v as FilterFeatured)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'featured', label: 'Featured' },
            { value: 'not_featured', label: 'Not Featured' },
          ]}
        />
        <AdminSelectFilter
          label="Category"
          value={filterCategory}
          onChange={setFilterCategory}
          options={categories.map(c => ({ 
            value: c, 
            label: c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)
          }))}
        />
        <AdminSortSelect
          value={sortBy}
          onChange={(v) => setSortBy(v as SortOption)}
          options={[
            { value: 'created_desc', label: 'Newest' },
            { value: 'created_asc', label: 'Oldest' },
            { value: 'price_high', label: 'Price: High' },
            { value: 'price_low', label: 'Price: Low' },
            { value: 'title', label: 'Title A-Z' },
          ]}
        />
        <ExportButton onExport={exportAllListings} label="Export" />
      </AdminFilterBar>

      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">
          {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}
          {filteredListings.length !== listings.length && ` (filtered from ${listings.length})`}
        </span>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Active: {listings.filter(l => l.status === 'active').length}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            Banned: {listings.filter(l => l.status === 'banned').length}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            Featured: {listings.filter(l => l.is_featured).length}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {filteredListings.map((listing, index) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <Card 
              hover={true} 
              className={`cursor-pointer p-4 ${listing.status === 'banned' ? 'border-red-500/30 bg-red-500/5' : ''}`}
              onClick={() => setSelectedListing(listing)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800">
                    <Package className="h-6 w-6 text-zinc-500" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-white">{listing.title}</h3>
                      <span className={`rounded px-2 py-0.5 text-xs ${statusColors[listing.status] || statusColors.draft}`}>
                        {listing.status === 'banned' && <Ban className="mr-1 inline h-3 w-3" />}
                        {listing.status}
                      </span>
                      {listing.is_featured && (
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                          <Star className="mr-1 inline h-3 w-3 fill-amber-400" />
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-zinc-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {listing.seller?.display_name || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {listing.price.toLocaleString()}
                      </span>
                      <span className="capitalize">{listing.category}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleQuickToggleFeatured(listing, e)}
                    disabled={togglingFeatured === listing.id || listing.status === 'banned'}
                    className={`rounded-lg p-2 transition-colors ${
                      listing.is_featured 
                        ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    } disabled:opacity-50`}
                    title={listing.is_featured ? 'Remove feature' : 'Feature listing'}
                  >
                    {togglingFeatured === listing.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star className={`h-4 w-4 ${listing.is_featured ? 'fill-amber-400' : ''}`} />
                    )}
                  </button>
                  {listing.status === 'banned' ? (
                    <button
                      onClick={(e) => handleUnban(listing, e)}
                      disabled={processing === listing.id}
                      className="rounded-lg bg-green-500/20 p-2 text-green-400 hover:bg-green-500/30"
                      title="Unban listing"
                    >
                      {processing === listing.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setBanModalListing(listing)
                      }}
                      className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                      title="Ban listing"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedListing(listing)
                    }}
                    className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <a
                    href={`/listing/${listing.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    title="Open listing"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              
              {listing.status === 'banned' && listing.ban_reason && (
                <div className="mt-3 flex items-start gap-2 rounded bg-red-500/10 p-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <span className="text-red-300">Ban reason: {listing.ban_reason}</span>
                </div>
              )}
            </Card>
          </motion.div>
        ))}

        {filteredListings.length === 0 && (
          <Card hover={false} className="p-8">
            <div className="text-center text-zinc-500">
              {searchQuery || filterStatus !== 'all' || filterFeatured !== 'all' || filterCategory !== 'all'
                ? 'No listings match your filters'
                : 'No listings found'
              }
            </div>
          </Card>
        )}
      </div>

      {/* Listing Detail Modal */}
      <ListingDetailModal
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        listing={selectedListing}
        onUpdate={loadListings}
        onViewUser={handleViewUser}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId}
        userName={selectedUserName}
        onUpdate={loadListings}
      />

      {/* Ban Listing Modal */}
      <AdminModal
        isOpen={!!banModalListing}
        onClose={() => {
          setBanModalListing(null)
          setBanReason('')
        }}
        title="Ban Listing"
        subtitle={banModalListing?.title}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setBanModalListing(null)
                setBanReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBan}
              disabled={!banReason.trim() || processing === banModalListing?.id}
              className="bg-red-600 hover:bg-red-500"
            >
              {processing === banModalListing?.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Ban className="mr-2 h-4 w-4" />
              )}
              Ban Listing
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div className="text-sm text-red-300">
              <p className="font-medium">Warning</p>
              <p>Banning this listing will remove it from public view and notify the seller.</p>
            </div>
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Reason for ban <span className="text-red-400">*</span>
            </label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Describe why this listing is being banned..."
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
      </AdminModal>
    </div>
  )
}
