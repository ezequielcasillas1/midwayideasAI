'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Menu, X, Rocket, User, LogOut, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navLinks = [
  { href: '/browse', label: 'Browse' },
  { href: '/preview/landing', label: 'Preview' },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 15 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600"
          >
            <Rocket className="h-5 w-5 text-white" />
          </motion.div>
          <span className="text-xl font-bold text-white">
            MIDWAY<span className="text-violet-400">IDEAS</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative px-4 py-2 text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              {link.label}
              {pathname === link.href && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500"
                />
              )}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <div className="h-10 w-24 animate-pulse rounded-xl bg-zinc-800" />
          ) : user ? (
            <>
              <Link href="/dashboard/new">
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                  Sell Project
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">
                  <User className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Menu className="h-6 w-6 text-white" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="border-t border-zinc-800 bg-zinc-950 px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-zinc-800" />
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full justify-start">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full">Log in</Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  )
}
