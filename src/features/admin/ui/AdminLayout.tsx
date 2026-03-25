'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Shield, 
  ShieldCheck,
  Crown, 
  Handshake, 
  Megaphone, 
  BarChart3, 
  Lock,
  Package,
  History,
  Users
} from 'lucide-react'
import { Card } from '@/components/ui'
import { useAdmin } from '../hooks/useAdmin'
import { ADMIN_ENABLED } from '@/lib/admin-config'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { href: '/admin', label: 'Overview', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/sovereigns', label: 'Sovereigns', icon: Crown },
  { href: '/admin/cofounders', label: 'Co-founders', icon: Handshake },
  { href: '/admin/listings', label: 'Listings', icon: Package },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/moderation', label: 'Moderation', icon: ShieldCheck },
  { href: '/admin/activity', label: 'Activity Log', icon: History },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const { isAdmin, loading } = useAdmin()

  if (!ADMIN_ENABLED) {
    return (
      <Card hover={false} className="mx-auto max-w-md p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-red-500/10 p-4">
            <Lock className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">Not Available</h2>
          <p className="text-zinc-400">
            Admin dashboard is only available in development mode.
          </p>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <Card hover={false} className="mx-auto max-w-md p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-red-500/10 p-4">
            <Lock className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">Access Denied</h2>
          <p className="text-zinc-400">
            You don&apos;t have permission to access the admin dashboard.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex gap-6">
      <aside className="hidden w-64 shrink-0 lg:block">
        <Card hover={false} className="sticky top-24 p-4">
          <div className="mb-4 flex items-center gap-2 border-b border-zinc-800 pb-4">
            <div className="rounded-lg bg-violet-500/10 p-2">
              <Shield className="h-5 w-5 text-violet-400" />
            </div>
            <span className="font-semibold text-white">Admin Panel</span>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-violet-500/10 text-violet-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </Card>
      </aside>

      <main className="min-w-0 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
