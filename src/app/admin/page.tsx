'use client'

import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { AdminLayout, AdminStatsCards, useAdmin } from '@/features/admin'
import { Card } from '@/components/ui'
import { Shield } from 'lucide-react'
import { ADMIN_ENABLED } from '@/lib/admin-config'

export default function AdminPage() {
  if (!ADMIN_ENABLED) {
    notFound()
  }

  const { stats, loading } = useAdmin()

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
          </div>
        </AdminLayout>
      </main>
    </div>
  )
}
