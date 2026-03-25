'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, User, Calendar, Tag, DollarSign, Eye, Star,
  ExternalLink, AlertTriangle, Check, X
} from 'lucide-react'
import { AdminModal } from './AdminModal'
import { InfoTooltip } from './InfoTooltip'
import { toggleListingFeatured, removeListing, logAdminActivity } from '../services/admin-service'
import type { User as UserType, Listing } from '@/types'

interface ListingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  listing: {
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
  } | null
  onUpdate: () => void
  onViewUser?: (userId: string, userName?: string) => void
}

export function ListingDetailModal({ 
  isOpen, 
  onClose, 
  listing,
  onUpdate,
  onViewUser
}: ListingDetailModalProps) {
  const [showRemoveForm, setShowRemoveForm] = useState(false)
  const [removeReason, setRemoveReason] = useState('')
  const [processing, setProcessing] = useState(false)

  if (!listing) return null

  async function handleToggleFeatured() {
    setProcessing(true)
    const success = await toggleListingFeatured(listing!.id, !listing!.is_featured)
    if (success) {
      onUpdate()
    }
    setProcessing(false)
  }

  async function handleRemove() {
    if (!removeReason.trim()) return
    
    setProcessing(true)
    const success = await removeListing(listing!.id, removeReason.trim())
    if (success) {
      setShowRemoveForm(false)
      setRemoveReason('')
      onUpdate()
      onClose()
    }
    setProcessing(false)
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    sold: 'bg-blue-500/20 text-blue-400',
    draft: 'bg-zinc-700 text-zinc-400',
    removed: 'bg-red-500/20 text-red-400'
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={listing.title}
      subtitle={`Listed by ${listing.seller?.display_name || 'Unknown'}`}
      size="md"
      footer={
        <div className="flex items-center justify-between">
          <a
            href={`/listing/${listing.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
          >
            <ExternalLink className="h-4 w-4" />
            View listing
          </a>
          <div className="flex gap-2">
            <button
              onClick={handleToggleFeatured}
              disabled={processing}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                listing.is_featured
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              <Star className={`mr-2 inline h-4 w-4 ${listing.is_featured ? 'fill-amber-400' : ''}`} />
              {listing.is_featured ? 'Featured' : 'Feature'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status & Quick Info */}
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[listing.status] || statusColors.draft}`}>
            {listing.status}
          </span>
          {listing.is_featured && (
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-400">
              <Star className="mr-1 inline h-3 w-3 fill-amber-400" />
              Featured
            </span>
          )}
          <span className="text-sm text-zinc-500">
            ID: <span className="font-mono">{listing.id.slice(0, 8)}...</span>
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
              <DollarSign className="h-4 w-4" />
              Price
            </div>
            <p className="text-xl font-semibold text-white">
              ${listing.price.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
              <Tag className="h-4 w-4" />
              Category
            </div>
            <p className="text-lg font-medium capitalize text-white">
              {listing.category}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
              <Calendar className="h-4 w-4" />
              Created
            </div>
            <p className="text-white">
              {new Date(listing.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {listing.is_featured && listing.featured_until && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
                <Star className="h-4 w-4" />
                Featured Until
              </div>
              <p className="text-white">
                {new Date(listing.featured_until).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Seller Section */}
        {listing.seller && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <User className="h-4 w-4" />
                Seller
              </div>
              {onViewUser && (
                <button
                  onClick={() => onViewUser(listing.seller_id, listing.seller?.display_name || undefined)}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  View profile
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {listing.seller.avatar_url ? (
                <img
                  src={listing.seller.avatar_url}
                  alt=""
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 text-violet-400">
                  {(listing.seller.display_name || listing.seller.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-white">
                  {listing.seller.display_name || 'Unknown'}
                </p>
                <p className="text-sm text-zinc-500">{listing.seller.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
            <div className="mb-2 text-sm text-zinc-400">Description</div>
            <p className="text-zinc-300">{listing.description}</p>
          </div>
        )}

        {/* Admin Actions */}
        {listing.status !== 'removed' && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Admin Actions</span>
            </div>

            {!showRemoveForm ? (
              <button
                onClick={() => setShowRemoveForm(true)}
                className="rounded bg-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/30"
              >
                Remove Listing
              </button>
            ) : (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-3"
              >
                <p className="text-sm text-zinc-400">
                  This will hide the listing from public view. Provide a reason:
                </p>
                <textarea
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  placeholder="Reason for removal..."
                  rows={2}
                  className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleRemove}
                    disabled={processing || !removeReason.trim()}
                    className="flex items-center gap-1 rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Confirm Remove
                  </button>
                  <button
                    onClick={() => {
                      setShowRemoveForm(false)
                      setRemoveReason('')
                    }}
                    className="flex items-center gap-1 rounded bg-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-600"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </AdminModal>
  )
}
