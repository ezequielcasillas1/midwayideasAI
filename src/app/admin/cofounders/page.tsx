'use client'

import { notFound } from 'next/navigation'
import { Handshake } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { AdminLayout, CofounderRequestsList, useAdminCofounderRequests } from '@/features/admin'
import { Card } from '@/components/ui'
import { ADMIN_ENABLED } from '@/lib/admin-config'

export default function CofoundersPage() {
  if (!ADMIN_ENABLED) {
    notFound()
  }

  const { requests, loading, refetch } = useAdminCofounderRequests()

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <AdminLayout>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/10 p-3">
                <Handshake className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Co-founder Requests</h1>
                <p className="text-sm text-zinc-400">
                  {pendingCount} pending • {requests.length} total
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} hover={false} className="h-32 animate-pulse bg-zinc-800/50" />
                ))}
              </div>
            ) : (
              <CofounderRequestsList requests={requests} onUpdate={refetch} />
            )}
          </div>
        </AdminLayout>
      </main>
    </div>
  )
}
