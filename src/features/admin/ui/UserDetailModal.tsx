'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Mail, Calendar, Crown, Coins, Package, 
  Edit2, Check, X, Plus, Minus, ExternalLink,
  ChevronDown, ChevronUp, FileText, AlertCircle
} from 'lucide-react'
import { AdminModal } from './AdminModal'
import { InfoTooltip } from './InfoTooltip'
import { 
  getUserDetails, 
  updateUserDisplayName, 
  updateUserMembershipTier,
  adjustUserPoints,
  toggleListingFeatured,
  type UserDetails 
} from '../services/admin-service'
import { TIER_CONFIG, type MembershipTier } from '@/lib/membership-config'
import { USE_MOCK_DATA, mockListings } from '@/lib/mockData'
import type { CofounderRequest } from '@/types'

interface UserDetailModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
  userName?: string
  onUpdate?: () => void
}

export function UserDetailModal({ 
  isOpen, 
  onClose, 
  userId,
  userName,
  onUpdate
}: UserDetailModalProps) {
  const [details, setDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingTier, setEditingTier] = useState(false)
  const [selectedTier, setSelectedTier] = useState('')
  const [showPointsForm, setShowPointsForm] = useState(false)
  const [pointsAmount, setPointsAmount] = useState('')
  const [pointsReason, setPointsReason] = useState('')
  const [expandedSection, setExpandedSection] = useState<string | null>('profile')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      loadUserDetails()
    }
  }, [isOpen, userId])

  async function loadUserDetails() {
    if (!userId) return
    setLoading(true)

    if (USE_MOCK_DATA) {
      const userListings = mockListings.filter(l => l.seller_id === userId).map(l => ({
        id: l.id,
        title: l.title,
        status: l.status,
        is_featured: l.is_featured || false,
        created_at: l.created_at
      }))
      
      setDetails({
        user: {
          id: userId,
          email: `${userName?.toLowerCase().replace(' ', '.')}@example.com`,
          display_name: userName || 'User',
          avatar_url: null,
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        },
        membership: {
          id: 'mock-membership',
          tier: 'sovereign',
          points: 850,
          is_verified: true,
          beta_earning_rate: true,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        listings: userListings,
        pointTransactions: [
          { id: '1', amount: 100, reason: 'Listing sale', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '2', amount: 50, reason: 'Referral bonus', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '3', amount: -25, reason: 'Feature listing', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        cofounderRequest: null
      })
      setLoading(false)
      return
    }

    const data = await getUserDetails(userId)
    setDetails(data)
    setLoading(false)
  }

  async function handleSaveName() {
    if (!userId || !newName.trim()) return
    setSaving(true)
    const success = await updateUserDisplayName(userId, newName.trim())
    if (success) {
      setDetails(prev => prev ? { ...prev, user: { ...prev.user, display_name: newName.trim() } } : null)
      setEditingName(false)
      onUpdate?.()
    }
    setSaving(false)
  }

  async function handleSaveTier() {
    if (!userId || !selectedTier) return
    setSaving(true)
    const success = await updateUserMembershipTier(userId, selectedTier)
    if (success) {
      setDetails(prev => prev && prev.membership ? { 
        ...prev, 
        membership: { ...prev.membership, tier: selectedTier } 
      } : prev)
      setEditingTier(false)
      onUpdate?.()
    }
    setSaving(false)
  }

  async function handleAdjustPoints() {
    if (!userId || !pointsAmount || !pointsReason.trim()) return
    setSaving(true)
    const amount = parseInt(pointsAmount)
    const success = await adjustUserPoints(userId, amount, pointsReason.trim())
    if (success) {
      setDetails(prev => prev && prev.membership ? {
        ...prev,
        membership: { ...prev.membership, points: prev.membership.points + amount },
        pointTransactions: [
          { id: Date.now().toString(), amount, reason: `[Admin] ${pointsReason}`, created_at: new Date().toISOString() },
          ...prev.pointTransactions
        ]
      } : prev)
      setShowPointsForm(false)
      setPointsAmount('')
      setPointsReason('')
      onUpdate?.()
    }
    setSaving(false)
  }

  async function handleToggleFeatured(listingId: string, currentFeatured: boolean) {
    const success = await toggleListingFeatured(listingId, !currentFeatured)
    if (success) {
      setDetails(prev => prev ? {
        ...prev,
        listings: prev.listings.map(l => 
          l.id === listingId ? { ...l, is_featured: !currentFeatured } : l
        )
      } : null)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const tierDisplay = details?.membership?.tier 
    ? TIER_CONFIG[details.membership.tier as MembershipTier]?.name || details.membership.tier
    : 'No membership'

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={details?.user.display_name || userName || 'User Details'}
      subtitle={details?.user.email}
      size="lg"
      footer={
        <div className="flex items-center justify-between">
          <a
            href={`/profile/${userId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
          >
            <ExternalLink className="h-4 w-4" />
            View as user
          </a>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
          >
            Close
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : details ? (
        <div className="space-y-4">
          {/* Profile Section */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50">
            <button
              onClick={() => toggleSection('profile')}
              className="flex w-full items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-violet-400" />
                <span className="font-medium text-white">Profile</span>
              </div>
              {expandedSection === 'profile' ? (
                <ChevronUp className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              )}
            </button>
            
            {expandedSection === 'profile' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-zinc-700 p-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Display Name</label>
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveName}
                          disabled={saving}
                          className="rounded p-1 text-green-400 hover:bg-zinc-700"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingName(false)}
                          className="rounded p-1 text-zinc-400 hover:bg-zinc-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-white">{details.user.display_name || 'Not set'}</span>
                        <button
                          onClick={() => {
                            setNewName(details.user.display_name || '')
                            setEditingName(true)
                          }}
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-white"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-zinc-500" />
                      <span className="text-white">{details.user.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Member Since</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <span className="text-white">
                        {new Date(details.user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">User ID</label>
                    <span className="font-mono text-xs text-zinc-400">{details.user.id}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Membership Section */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50">
            <button
              onClick={() => toggleSection('membership')}
              className="flex w-full items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="font-medium text-white">Membership</span>
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
                  {tierDisplay}
                </span>
              </div>
              {expandedSection === 'membership' ? (
                <ChevronUp className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              )}
            </button>
            
            {expandedSection === 'membership' && details.membership && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-zinc-700 p-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                      Tier
                      <InfoTooltip content="Change the user's membership tier manually" />
                    </label>
                    {editingTier ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedTier}
                          onChange={(e) => setSelectedTier(e.target.value)}
                          className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white"
                        >
                          {Object.entries(TIER_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleSaveTier}
                          disabled={saving}
                          className="rounded p-1 text-green-400 hover:bg-zinc-700"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingTier(false)}
                          className="rounded p-1 text-zinc-400 hover:bg-zinc-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-white">{tierDisplay}</span>
                        <button
                          onClick={() => {
                            setSelectedTier(details.membership?.tier || 'citizen')
                            setEditingTier(true)
                          }}
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-white"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                      Points
                      <InfoTooltip content="Add or deduct points from this user's balance" />
                    </label>
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-amber-400" />
                      <span className="text-lg font-semibold text-white">
                        {details.membership.points}
                      </span>
                      <button
                        onClick={() => setShowPointsForm(!showPointsForm)}
                        className="rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-600"
                      >
                        Adjust
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Verified</label>
                    <span className={details.membership.is_verified ? 'text-green-400' : 'text-zinc-500'}>
                      {details.membership.is_verified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Upgrade Date</label>
                    <span className="text-white">
                      {new Date(details.membership.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {showPointsForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900 p-3"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <button
                        onClick={() => setPointsAmount(prev => String(Math.abs(parseInt(prev) || 0)))}
                        className={`rounded px-2 py-1 text-xs ${
                          !pointsAmount.startsWith('-') 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        <Plus className="mr-1 inline h-3 w-3" />
                        Add
                      </button>
                      <button
                        onClick={() => setPointsAmount(prev => {
                          const num = Math.abs(parseInt(prev) || 0)
                          return num > 0 ? `-${num}` : prev
                        })}
                        className={`rounded px-2 py-1 text-xs ${
                          pointsAmount.startsWith('-') 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        <Minus className="mr-1 inline h-3 w-3" />
                        Deduct
                      </button>
                    </div>
                    <input
                      type="number"
                      value={pointsAmount}
                      onChange={(e) => setPointsAmount(e.target.value)}
                      placeholder="Amount"
                      className="mb-2 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                    />
                    <input
                      type="text"
                      value={pointsReason}
                      onChange={(e) => setPointsReason(e.target.value)}
                      placeholder="Reason for adjustment"
                      className="mb-2 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                    />
                    <button
                      onClick={handleAdjustPoints}
                      disabled={saving || !pointsAmount || !pointsReason.trim()}
                      className="w-full rounded bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                    >
                      Apply Adjustment
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          {/* Listings Section */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50">
            <button
              onClick={() => toggleSection('listings')}
              className="flex w-full items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-400" />
                <span className="font-medium text-white">Listings</span>
                <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                  {details.listings.length}
                </span>
              </div>
              {expandedSection === 'listings' ? (
                <ChevronUp className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              )}
            </button>
            
            {expandedSection === 'listings' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-zinc-700"
              >
                {details.listings.length === 0 ? (
                  <p className="p-4 text-center text-sm text-zinc-500">No listings</p>
                ) : (
                  <div className="max-h-60 divide-y divide-zinc-700/50 overflow-y-auto">
                    {details.listings.map(listing => (
                      <div key={listing.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{listing.title}</p>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span className={listing.status === 'active' ? 'text-green-400' : ''}>
                              {listing.status}
                            </span>
                            <span>•</span>
                            <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleFeatured(listing.id, listing.is_featured)}
                          className={`rounded px-2 py-1 text-xs ${
                            listing.is_featured
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                          }`}
                        >
                          {listing.is_featured ? 'Featured' : 'Feature'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Points History Section */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50">
            <button
              onClick={() => toggleSection('points')}
              className="flex w-full items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-400" />
                <span className="font-medium text-white">Points History</span>
              </div>
              {expandedSection === 'points' ? (
                <ChevronUp className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              )}
            </button>
            
            {expandedSection === 'points' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-zinc-700"
              >
                {details.pointTransactions.length === 0 ? (
                  <p className="p-4 text-center text-sm text-zinc-500">No transactions</p>
                ) : (
                  <div className="max-h-60 divide-y divide-zinc-700/50 overflow-y-auto">
                    {details.pointTransactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm text-zinc-300">{tx.reason}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`font-medium ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.amount >= 0 ? '+' : ''}{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Co-founder Request Section */}
          {details.cofounderRequest && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50">
              <button
                onClick={() => toggleSection('cofounder')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-400" />
                  <span className="font-medium text-white">Co-founder Request</span>
                  <StatusBadge status={details.cofounderRequest.status} />
                </div>
                {expandedSection === 'cofounder' ? (
                  <ChevronUp className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                )}
              </button>
              
              {expandedSection === 'cofounder' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-zinc-700 p-4"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Vision</label>
                      <p className="text-sm text-zinc-300">{details.cofounderRequest.vision}</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Experience</label>
                      <p className="text-sm text-zinc-300">{details.cofounderRequest.experience}</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Submitted</label>
                      <p className="text-sm text-zinc-300">
                        {new Date(details.cofounderRequest.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center text-zinc-500">
          <AlertCircle className="mb-2 h-8 w-8" />
          <p>User not found</p>
        </div>
      )}
    </AdminModal>
  )
}

function StatusBadge({ status }: { status: CofounderRequest['status'] }) {
  const colors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    in_discussion: 'bg-blue-500/20 text-blue-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400'
  }
  
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${colors[status]}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
