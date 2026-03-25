'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, User, Mail, Eye, Ban, CheckCircle, Crown, Package,
  Loader2, AlertTriangle, ExternalLink
} from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { AdminSearchBar } from './AdminSearchBar'
import { AdminSelectFilter, AdminFilterBar, AdminSortSelect } from './AdminFilters'
import { ExportButton } from './ExportButton'
import { UserDetailModal } from './UserDetailModal'
import { AdminModal } from './AdminModal'
import { 
  getAllUsers, 
  banUser, 
  unbanUser,
  type UserWithMembership 
} from '../services/admin-service'
import { exportAllUsers } from '../services/export-service'
import { USE_MOCK_DATA } from '@/lib/mockData'
import { TIER_CONFIG, type MembershipTier } from '@/lib/membership-config'

type FilterTier = 'all' | 'citizen' | 'knight' | 'baron' | 'duke' | 'sovereign'
type FilterStatus = 'all' | 'active' | 'banned'
type SortOption = 'newest' | 'oldest' | 'name' | 'points_high' | 'listings'

export function UsersManager() {
  const [users, setUsers] = useState<UserWithMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<FilterTier>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  
  const [banModalUser, setBanModalUser] = useState<UserWithMembership | null>(null)
  const [banReason, setBanReason] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    
    if (USE_MOCK_DATA) {
      const mockUsers: UserWithMembership[] = [
        { id: '1', email: 'john@example.com', display_name: 'John Doe', avatar_url: null, created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), is_banned: false, ban_reason: null, membership: { tier: 'sovereign', points: 850 }, listings_count: 5 },
        { id: '2', email: 'jane@example.com', display_name: 'Jane Smith', avatar_url: null, created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), is_banned: false, ban_reason: null, membership: { tier: 'duke', points: 420 }, listings_count: 3 },
        { id: '3', email: 'bob@example.com', display_name: 'Bob Wilson', avatar_url: null, created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), is_banned: true, ban_reason: 'Spam listings', membership: { tier: 'knight', points: 150 }, listings_count: 12 },
        { id: '4', email: 'alice@example.com', display_name: 'Alice Brown', avatar_url: null, created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), is_banned: false, ban_reason: null, membership: { tier: 'baron', points: 280 }, listings_count: 2 },
        { id: '5', email: 'charlie@example.com', display_name: 'Charlie Davis', avatar_url: null, created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), is_banned: false, ban_reason: null, membership: { tier: 'citizen', points: 50 }, listings_count: 1 },
        { id: '6', email: 'diana@example.com', display_name: 'Diana Miller', avatar_url: null, created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), is_banned: false, ban_reason: null, membership: { tier: 'sovereign', points: 920 }, listings_count: 8 },
      ]
      setUsers(mockUsers)
      setLoading(false)
      return
    }

    const data = await getAllUsers()
    setUsers(data)
    setLoading(false)
  }

  const filteredUsers = useMemo(() => {
    let result = [...users]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(u => 
        u.display_name?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      )
    }
    
    if (filterTier !== 'all') {
      result = result.filter(u => u.membership?.tier === filterTier)
    }
    
    if (filterStatus !== 'all') {
      result = result.filter(u => filterStatus === 'banned' ? u.is_banned : !u.is_banned)
    }
    
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'name') return (a.display_name || a.email).localeCompare(b.display_name || b.email)
      if (sortBy === 'points_high') return (b.membership?.points || 0) - (a.membership?.points || 0)
      if (sortBy === 'listings') return b.listings_count - a.listings_count
      return 0
    })
    
    return result
  }, [users, searchQuery, filterTier, filterStatus, sortBy])

  async function handleBan() {
    if (!banModalUser || !banReason.trim()) return
    
    setProcessing(banModalUser.id)
    const success = await banUser(banModalUser.id, banReason.trim())
    if (success) {
      setUsers(prev => prev.map(u => 
        u.id === banModalUser.id 
          ? { ...u, is_banned: true, ban_reason: banReason.trim() }
          : u
      ))
      setBanModalUser(null)
      setBanReason('')
    }
    setProcessing(null)
  }

  async function handleUnban(user: UserWithMembership) {
    setProcessing(user.id)
    const success = await unbanUser(user.id)
    if (success) {
      setUsers(prev => prev.map(u => 
        u.id === user.id 
          ? { ...u, is_banned: false, ban_reason: null }
          : u
      ))
    }
    setProcessing(null)
  }

  function getTierBadge(tier: string) {
    const config = TIER_CONFIG[tier as MembershipTier]
    const colors: Record<string, string> = {
      citizen: 'bg-zinc-700 text-zinc-300',
      knight: 'bg-blue-500/20 text-blue-400',
      baron: 'bg-emerald-500/20 text-emerald-400',
      duke: 'bg-violet-500/20 text-violet-400',
      sovereign: 'bg-amber-500/20 text-amber-400'
    }
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[tier] || colors.citizen}`}>
        {config?.name || tier}
      </span>
    )
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
          placeholder="Search by name or email..."
          className="min-w-[200px] flex-1"
        />
        <AdminSelectFilter
          label="Tier"
          value={filterTier}
          onChange={(v) => setFilterTier(v as FilterTier)}
          options={[
            { value: 'all', label: 'All Tiers' },
            { value: 'citizen', label: 'Citizen' },
            { value: 'knight', label: 'Knight' },
            { value: 'baron', label: 'Baron' },
            { value: 'duke', label: 'Duke' },
            { value: 'sovereign', label: 'Sovereign' },
          ]}
        />
        <AdminSelectFilter
          label="Status"
          value={filterStatus}
          onChange={(v) => setFilterStatus(v as FilterStatus)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'banned', label: 'Banned' },
          ]}
        />
        <AdminSortSelect
          value={sortBy}
          onChange={(v) => setSortBy(v as SortOption)}
          options={[
            { value: 'newest', label: 'Newest' },
            { value: 'oldest', label: 'Oldest' },
            { value: 'name', label: 'Name A-Z' },
            { value: 'points_high', label: 'Most Points' },
            { value: 'listings', label: 'Most Listings' },
          ]}
        />
        <ExportButton onExport={exportAllUsers} label="Export" />
      </AdminFilterBar>

      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          {filteredUsers.length !== users.length && ` (filtered from ${users.length})`}
        </span>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Active: {users.filter(u => !u.is_banned).length}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            Banned: {users.filter(u => u.is_banned).length}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <Card 
              hover={true} 
              className={`cursor-pointer p-4 ${user.is_banned ? 'border-red-500/30 bg-red-500/5' : ''}`}
              onClick={() => {
                setSelectedUserId(user.id)
                setSelectedUserName(user.display_name || user.email)
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
                      <User className="h-5 w-5 text-zinc-400" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">
                        {user.display_name || user.email.split('@')[0]}
                      </p>
                      {getTierBadge(user.membership?.tier || 'citizen')}
                      {user.is_banned && (
                        <span className="flex items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                          <Ban className="h-3 w-3" />
                          Banned
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                      <span>{user.email}</span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {user.listings_count} listings
                      </span>
                      <span className="flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        {user.membership?.points || 0} pts
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${user.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    title="Send email"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedUserId(user.id)
                      setSelectedUserName(user.display_name || user.email)
                    }}
                    className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {user.is_banned ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnban(user)
                      }}
                      disabled={processing === user.id}
                      className="rounded-lg bg-green-500/20 p-2 text-green-400 hover:bg-green-500/30"
                      title="Unban user"
                    >
                      {processing === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setBanModalUser(user)
                      }}
                      className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                      title="Ban user"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {user.is_banned && user.ban_reason && (
                <div className="mt-3 flex items-start gap-2 rounded bg-red-500/10 p-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <span className="text-red-300">Ban reason: {user.ban_reason}</span>
                </div>
              )}
            </Card>
          </motion.div>
        ))}

        {filteredUsers.length === 0 && (
          <Card hover={false} className="p-8">
            <div className="text-center text-zinc-500">
              {searchQuery || filterTier !== 'all' || filterStatus !== 'all'
                ? 'No users match your filters'
                : 'No users found'
              }
            </div>
          </Card>
        )}
      </div>

      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId}
        userName={selectedUserName}
        onUpdate={loadUsers}
      />

      {/* Ban User Modal */}
      <AdminModal
        isOpen={!!banModalUser}
        onClose={() => {
          setBanModalUser(null)
          setBanReason('')
        }}
        title="Ban User"
        subtitle={banModalUser?.display_name || banModalUser?.email}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setBanModalUser(null)
                setBanReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBan}
              disabled={!banReason.trim() || processing === banModalUser?.id}
              className="bg-red-600 hover:bg-red-500"
            >
              {processing === banModalUser?.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Ban className="mr-2 h-4 w-4" />
              )}
              Ban User
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div className="text-sm text-red-300">
              <p className="font-medium">Warning</p>
              <p>Banning this user will prevent them from logging in and hide their listings from public view.</p>
            </div>
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Reason for ban <span className="text-red-400">*</span>
            </label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Describe why this user is being banned..."
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
      </AdminModal>
    </div>
  )
}
