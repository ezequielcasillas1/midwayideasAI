'use client'

import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ADMIN_ENABLED } from '@/lib/admin-config'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'
import { ActivityLog } from '@/features/admin/ui/ActivityLog'

export default function AdminActivityPage() {
  if (!ADMIN_ENABLED) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <AdminLayout>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Activity Log</h1>
              <p className="text-zinc-400">View all admin actions and changes</p>
            </div>

            <ActivityLog />
          </div>
        </AdminLayout>
      </main>
    </div>
  )
}
