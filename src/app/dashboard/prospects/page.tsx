'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, UserCheck, MessageSquare, TrendingUp, 
  Loader2, Mail, ExternalLink, Calendar, DollarSign,
  Linkedin, Twitter, Globe, Instagram, Eye, CheckCircle,
  ArrowUpRight, Filter, ChevronDown
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Card, Button } from '@/components/ui'
import { ProspectScoreBadge, ProspectScoreBar } from '@/features/prospects/ui'
import { 
  getProspectsForSeller, 
  getProspectStats, 
  updateProspectStatus,
  markProspectViewed,
  type ProspectWithDetails,
  type ProspectStats
} from '@/features/prospects'
import type { ProspectStatus, User } from '@/types'

const BUDGET_LABELS: Record<string, string> = {
  under_10k: 'Under $10k',
  '10k_50k': '$10k - $50k',
  '50k_100k': '$50k - $100k',
  '100k_plus': '$100k+',
}

const TIMELINE_LABELS: Record<string, string> = {
  immediately: 'Ready Now',
  '1_3_months': '1-3 Months',
  '3_6_months': '3-6 Months',
  exploring: 'Just Exploring',
}

const STATUS_CONFIG = {
  interested: { label: 'New', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  contacted: { label: 'Contacted', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  converted: { label: 'Converted', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
}

export default function ProspectsDashboardPage() {
  const [prospects, setProspects] = useState<ProspectWithDetails[]>([])
  const [stats, setStats] = useState<ProspectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<ProspectStatus | 'all'>('all')
  const [selectedProspect, setSelectedProspect] = useState<ProspectWithDetails | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [prospectsData, statsData] = await Promise.all([
      getProspectsForSeller(),
      getProspectStats(),
    ])
    setProspects(prospectsData)
    setStats(statsData)
    setLoading(false)
  }

  async function handleStatusChange(prospectId: string, newStatus: ProspectStatus) {
    const success = await updateProspectStatus(prospectId, newStatus)
    if (success) {
      setProspects(prev => prev.map(p => 
        p.id === prospectId ? { ...p, status: newStatus } : p
      ))
      if (selectedProspect?.id === prospectId) {
        setSelectedProspect(prev => prev ? { ...prev, status: newStatus } : null)
      }
      loadData()
    }
  }

  async function handleViewProspect(prospect: ProspectWithDetails) {
    setSelectedProspect(prospect)
    if (!prospect.viewed_at) {
      await markProspectViewed(prospect.id)
      setProspects(prev => prev.map(p => 
        p.id === prospect.id ? { ...p, viewed_at: new Date().toISOString() } : p
      ))
    }
  }

  const filteredProspects = filterStatus === 'all' 
    ? prospects 
    : prospects.filter(p => p.status === filterStatus)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">My Prospects</h1>
              <p className="text-zinc-400">Track buyers interested in your listings</p>
            </div>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} hover={false} className="h-24 animate-pulse bg-zinc-800/50" />
              ))}
            </div>
          ) : stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard 
                label="Total Prospects" 
                value={stats.total} 
                icon={Users} 
                color="text-violet-400" 
              />
              <StatsCard 
                label="New This Week" 
                value={stats.newThisWeek} 
                icon={TrendingUp} 
                color="text-green-400" 
              />
              <StatsCard 
                label="Contacted" 
                value={stats.contacted} 
                icon={MessageSquare} 
                color="text-amber-400" 
              />
              <StatsCard 
                label="Converted" 
                value={stats.converted} 
                icon={UserCheck} 
                color="text-emerald-400" 
              />
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ProspectStatus | 'all')}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
              >
                <option value="all">All Prospects</option>
                <option value="interested">New / Interested</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
              </select>
            </div>
            <span className="text-sm text-zinc-500">
              {filteredProspects.length} prospect{filteredProspects.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Prospects List */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : filteredProspects.length === 0 ? (
            <Card hover={false} className="p-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
              <h3 className="mb-2 text-lg font-medium text-white">No prospects yet</h3>
              <p className="text-zinc-400">
                When buyers express interest in your listings, they'll appear here.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredProspects.map((prospect, index) => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  index={index}
                  onView={() => handleViewProspect(prospect)}
                  onStatusChange={(status) => handleStatusChange(prospect.id, status)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Prospect Detail Modal */}
        {selectedProspect && (
          <ProspectDetailModal
            prospect={selectedProspect}
            onClose={() => setSelectedProspect(null)}
            onStatusChange={(status) => handleStatusChange(selectedProspect.id, status)}
          />
        )}
      </main>
    </div>
  )
}

function StatsCard({ label, value, icon: Icon, color }: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card hover={false} className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          </div>
          <div className={`rounded-xl bg-zinc-800 p-3`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function ProspectCard({ prospect, index, onView, onStatusChange }: {
  prospect: ProspectWithDetails
  index: number
  onView: () => void
  onStatusChange: (status: ProspectStatus) => void
}) {
  const user = prospect.user
  const isNew = !prospect.viewed_at

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card 
        hover={true} 
        className={`cursor-pointer p-4 ${isNew ? 'border-violet-500/30' : ''}`}
        onClick={onView}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700">
                <Users className="h-6 w-6 text-zinc-400" />
              </div>
            )}
            
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white">
                  {user?.display_name || user?.email?.split('@')[0] || 'Unknown'}
                </h3>
                {isNew && (
                  <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-400">
                    New
                  </span>
                )}
                <ProspectScoreBadge score={prospect.prospect_score} size="sm" />
              </div>
              
              <p className="mt-0.5 text-sm text-zinc-400">
                Interested in: <span className="text-white">{prospect.listing?.title}</span>
              </p>
              
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                {user?.budget_range && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {BUDGET_LABELS[user.budget_range]}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(prospect.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className={`rounded-full border px-2 py-1 text-xs ${STATUS_CONFIG[prospect.status].color}`}>
              {STATUS_CONFIG[prospect.status].label}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onView()
              }}
              className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function ProspectDetailModal({ prospect, onClose, onStatusChange }: {
  prospect: ProspectWithDetails
  onClose: () => void
  onStatusChange: (status: ProspectStatus) => void
}) {
  const user = prospect.user

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700">
                  <Users className="h-8 w-8 text-zinc-400" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">
                  {user?.display_name || user?.email?.split('@')[0]}
                </h2>
                <p className="text-zinc-400">{user?.email}</p>
                <div className="mt-2">
                  <ProspectScoreBadge score={prospect.prospect_score} size="md" />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-700 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Score Bar */}
          <ProspectScoreBar score={prospect.prospect_score} />

          {/* Interest Details */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
            <h3 className="mb-3 text-sm font-medium text-zinc-400">Interest Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Listing</span>
                <span className="text-white">{prospect.listing?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Price</span>
                <span className="text-white">${prospect.listing?.price?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Expressed</span>
                <span className="text-white">{new Date(prospect.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Source</span>
                <span className="text-white capitalize">{prospect.source.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user?.bio && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
              <h3 className="mb-2 text-sm font-medium text-zinc-400">About</h3>
              <p className="text-white">{user.bio}</p>
            </div>
          )}

          {/* Budget & Timeline */}
          <div className="grid gap-4 sm:grid-cols-2">
            {user?.budget_range && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
                <h3 className="mb-2 text-sm font-medium text-zinc-400">Budget Range</h3>
                <p className="flex items-center gap-2 text-lg font-medium text-white">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  {BUDGET_LABELS[user.budget_range]}
                </p>
              </div>
            )}
            {user?.investment_timeline && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
                <h3 className="mb-2 text-sm font-medium text-zinc-400">Timeline</h3>
                <p className="flex items-center gap-2 text-lg font-medium text-white">
                  <Calendar className="h-5 w-5 text-violet-400" />
                  {TIMELINE_LABELS[user.investment_timeline]}
                </p>
              </div>
            )}
          </div>

          {/* Social Links */}
          {(user?.linkedin_url || user?.twitter_url || user?.instagram_url || user?.website) && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
              <h3 className="mb-3 text-sm font-medium text-zinc-400">Social Links</h3>
              <div className="flex flex-wrap gap-2">
                {user?.linkedin_url && (
                  <a
                    href={user.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-zinc-700 px-3 py-2 text-sm text-white hover:bg-zinc-600"
                  >
                    <Linkedin className="h-4 w-4 text-blue-400" />
                    LinkedIn
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {user?.twitter_url && (
                  <a
                    href={user.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-zinc-700 px-3 py-2 text-sm text-white hover:bg-zinc-600"
                  >
                    <Twitter className="h-4 w-4 text-sky-400" />
                    Twitter
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {user?.instagram_url && (
                  <a
                    href={user.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-zinc-700 px-3 py-2 text-sm text-white hover:bg-zinc-600"
                  >
                    <Instagram className="h-4 w-4 text-pink-400" />
                    Instagram
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {user?.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-zinc-700 px-3 py-2 text-sm text-white hover:bg-zinc-600"
                  >
                    <Globe className="h-4 w-4 text-emerald-400" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Verification Badges */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
            <h3 className="mb-3 text-sm font-medium text-zinc-400">Verification</h3>
            <div className="flex flex-wrap gap-2">
              <VerificationBadge 
                label="Email Verified" 
                verified={true} 
              />
              <VerificationBadge 
                label="Phone Verified" 
                verified={user?.phone_verified || false} 
              />
              <VerificationBadge 
                label="ID Verified" 
                verified={user?.id_verified || false} 
              />
              <VerificationBadge 
                label="Profile Complete" 
                verified={user?.profile_complete || false} 
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 border-t border-zinc-800 pt-6">
            <a
              href={`mailto:${user?.email}`}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-500"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </a>
            
            {prospect.status === 'interested' && (
              <Button
                variant="secondary"
                onClick={() => onStatusChange('contacted')}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Mark as Contacted
              </Button>
            )}
            
            {prospect.status !== 'converted' && (
              <Button
                variant="secondary"
                onClick={() => onStatusChange('converted')}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Converted
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function VerificationBadge({ label, verified }: { label: string; verified: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
      verified 
        ? 'bg-green-500/20 text-green-400' 
        : 'bg-zinc-700 text-zinc-500'
    }`}>
      {verified && <CheckCircle className="h-3 w-3" />}
      {label}
    </span>
  )
}
