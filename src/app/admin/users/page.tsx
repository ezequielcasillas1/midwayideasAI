'use client'

import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ADMIN_ENABLED } from '@/lib/admin-config'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'
import { UsersManager } from '@/features/admin/ui/UsersManager'

export default function AdminUsersPage() {
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
              <h1 className="text-2xl font-bold text-white">Users Management</h1>
              <p className="text-zinc-400">View, manage, and moderate all platform users</p>
            </div>

            <UsersManager />
          </div>
        </AdminLayout>
      </main>
    </div>
  )
}
