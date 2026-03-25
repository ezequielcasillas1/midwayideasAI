'use client'

import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { AdminLayout, AdminStatsCards, useAdmin } from '@/features/admin'
import { Card } from '@/components/ui'
import { Shield, Download, Users, Package, Crown, Megaphone, History } from 'lucide-react'
import { ADMIN_ENABLED } from '@/lib/admin-config'
import { ExportButton } from '@/features/admin/ui/ExportButton'
import { 
  exportAllUsers, 
  exportAllListings, 
  exportSovereignMembers, 
  exportCofounderRequests,
  exportAnnouncements,
  exportActivityLog
} from '@/features/admin/services/export-service'
import { ModerationStatsCard } from '@/features/admin/ui/ModerationStatsCard'

export default function AdminPage() {
  if (!ADMIN_ENABLED) {
    notFound()
  }

  const { stats, loading } = useAdmin()

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <AdminLayout>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/10 p-3">
                <Shield className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-zinc-400">Platform overview and management</p>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} hover={false} className="h-24 animate-pulse bg-zinc-800/50" />
                ))}
              </div>
            ) : stats ? (
              <AdminStatsCards stats={stats} />
            ) : null}

            {/* Moderation Stats */}
            <ModerationStatsCard />

            {/* Quick Export Section */}
            <Card hover={false} className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Download className="h-5 w-5 text-violet-400" />
                <h2 className="text-lg font-semibold text-white">Quick Export</h2>
              </div>
              <p className="mb-4 text-sm text-zinc-400">
                Download platform data as CSV files
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-white">All Users</span>
                  </div>
                  <ExportButton onExport={exportAllUsers} label="Export" size="sm" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-white">All Listings</span>
                  </div>
                  <ExportButton onExport={exportAllListings} label="Export" size="sm" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-400" />
                    <span className="text-sm text-white">Sovereigns</span>
                  </div>
                  <ExportButton onExport={exportSovereignMembers} label="Export" size="sm" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-400" />
                    <span className="text-sm text-white">Co-founders</span>
                  </div>
                  <ExportButton onExport={exportCofounderRequests} label="Export" size="sm" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-white">Announcements</span>
                  </div>
                  <ExportButton onExport={exportAnnouncements} label="Export" size="sm" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-white">Activity Log</span>
                  </div>
                  <ExportButton onExport={exportActivityLog} label="Export" size="sm" />
                </div>
              </div>
            </Card>
          </div>
        </AdminLayout>
      </main>
    </div>
  )
}
