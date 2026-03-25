'use client'

import { useState, useMemo } from 'react'
import { notFound } from 'next/navigation'
import { motion } from 'framer-motion'
import { Crown, User, Eye, Mail, ExternalLink } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui'
import { AdminLayout, useAdminSovereigns } from '@/features/admin'
import { AdminSearchBar } from '@/features/admin/ui/AdminSearchBar'
import { AdminSelectFilter, AdminFilterBar, AdminSortSelect } from '@/features/admin/ui/AdminFilters'
import { ExportButton } from '@/features/admin/ui/ExportButton'
import { UserDetailModal } from '@/features/admin/ui/UserDetailModal'
import { exportSovereignMembers } from '@/features/admin/services/export-service'
import { ADMIN_ENABLED } from '@/lib/admin-config'

type SortOption = 'newest' | 'oldest' | 'points_high' | 'points_low' | 'name'

export default function SovereignsPage() {
  if (!ADMIN_ENABLED) {
    notFound()
  }

  const { sovereigns, loading, refetch } = useAdminSovereigns()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string>('')

  const filteredSovereigns = useMemo(() => {
    let result = [...sovereigns]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s => 
        s.user.display_name?.toLowerCase().includes(query) ||
        s.user.email?.toLowerCase().includes(query)
      )
    }
    
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.membership.created_at).getTime() - new Date(a.membership.created_at).getTime()
      if (sortBy === 'oldest') return new Date(a.membership.created_at).getTime() - new Date(b.membership.created_at).getTime()
      if (sortBy === 'points_high') return b.membership.points - a.membership.points
      if (sortBy === 'points_low') return a.membership.points - b.membership.points
      if (sortBy === 'name') return (a.user.display_name || a.user.email).localeCompare(b.user.display_name || b.user.email)
      return 0
    })
    
    return result
  }, [sovereigns, searchQuery, sortBy])

  const handleViewUser = (userId: string, userName: string) => {
    setSelectedUserId(userId)
    setSelectedUserName(userName)
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <AdminLayout>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-500/10 p-3">
                  <Crown className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Sovereign Members</h1>
                  <p className="text-sm text-zinc-400">
                    {filteredSovereigns.length} lifetime member{filteredSovereigns.length !== 1 ? 's' : ''}
                    {filteredSovereigns.length !== sovereigns.length && ` (filtered from ${sovereigns.length})`}
                  </p>
                </div>
              </div>
            </div>

            <AdminFilterBar>
              <AdminSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name or email..."
                className="min-w-[200px] flex-1"
              />
              <AdminSortSelect
                value={sortBy}
                onChange={(v) => setSortBy(v as SortOption)}
                options={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' },
                  { value: 'points_high', label: 'Most Points' },
                  { value: 'points_low', label: 'Least Points' },
                  { value: 'name', label: 'Name A-Z' },
                ]}
              />
              <ExportButton onExport={exportSovereignMembers} label="Export CSV" />
            </AdminFilterBar>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} hover={false} className="h-20 animate-pulse bg-zinc-800/50" />
                ))}
              </div>
            ) : filteredSovereigns.length === 0 ? (
              <Card hover={false} className="p-8">
                <div className="text-center text-zinc-500">
                  {searchQuery ? 'No members match your search' : 'No Sovereign members yet'}
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredSovereigns.map((sovereign, index) => (
                  <motion.div
                    key={sovereign.user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card hover={true} className="cursor-pointer p-4" onClick={() => handleViewUser(sovereign.user.id, sovereign.user.display_name || sovereign.user.email)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {sovereign.user.avatar_url ? (
                            <img
                              src={sovereign.user.avatar_url}
                              alt={sovereign.user.display_name || 'User'}
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
                                {sovereign.user.display_name || sovereign.user.email.split('@')[0]}
                              </p>
                            </div>
                            <p className="text-sm text-zinc-500">{sovereign.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-amber-400">
                              <Crown className="h-4 w-4" />
                              <span className="font-medium">{sovereign.membership.points} pts</span>
                            </div>
                            <p className="text-xs text-zinc-500">
                              Joined {new Date(sovereign.membership.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <a
                              href={`mailto:${sovereign.user.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                              title="Send email"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewUser(sovereign.user.id, sovereign.user.display_name || sovereign.user.email)
                              }}
                              className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <a
                              href={`/profile/${sovereign.user.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                              title="View profile"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </AdminLayout>
      </main>

      <UserDetailModal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId}
        userName={selectedUserName}
        onUpdate={refetch}
      />
    </div>
  )
}
