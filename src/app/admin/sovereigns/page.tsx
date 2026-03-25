'use client'

import { notFound } from 'next/navigation'
import { motion } from 'framer-motion'
import { Crown, User } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui'
import { AdminLayout, useAdminSovereigns } from '@/features/admin'
import { ADMIN_ENABLED } from '@/lib/admin-config'

export default function SovereignsPage() {
  if (!ADMIN_ENABLED) {
    notFound()
  }

  const { sovereigns, loading } = useAdminSovereigns()

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminLayout>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/10 p-3">
                <Crown className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Sovereign Members</h1>
                <p className="text-sm text-zinc-400">
                  {sovereigns.length} lifetime members
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} hover={false} className="h-20 animate-pulse bg-zinc-800/50" />
                ))}
              </div>
            ) : sovereigns.length === 0 ? (
              <Card hover={false} className="p-8">
                <div className="text-center text-zinc-500">
                  No Sovereign members yet
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {sovereigns.map((sovereign, index) => (
                  <motion.div
                    key={sovereign.user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card hover={false} className="p-4">
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
                            <p className="font-medium text-white">
                              {sovereign.user.display_name || sovereign.user.email.split('@')[0]}
                            </p>
                            <p className="text-sm text-zinc-500">{sovereign.user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Crown className="h-4 w-4" />
                            <span className="font-medium">{sovereign.membership.points} pts</span>
                          </div>
                          <p className="text-xs text-zinc-500">
                            Joined {new Date(sovereign.membership.created_at).toLocaleDateString()}
                          </p>
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
    </div>
  )
}
