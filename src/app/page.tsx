'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Rocket, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/30"
        >
          <Rocket className="h-12 w-12 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300"
        >
          <Sparkles className="h-4 w-4" />
          Coming Soon
        </motion.div>

        <h1 className="mb-4 text-5xl font-bold tracking-tight text-white sm:text-7xl">
          MIDWAY
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            IDEAS
          </span>
        </h1>

        <p className="mx-auto mb-8 max-w-md text-lg text-zinc-400">
          The marketplace for unfinished projects. Buy and sell halfway-done apps, 
          websites, and tools.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/preview/landing">
            <Button size="lg">
              Preview Landing
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/browse">
            <Button variant="secondary" size="lg">
              Browse Projects
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <p className="mb-3 text-sm text-zinc-500">Quick links</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-zinc-400 hover:text-white"
            >
              Login
            </Link>
            <span className="text-zinc-700">·</span>
            <Link
              href="/auth/signup"
              className="text-sm text-zinc-400 hover:text-white"
            >
              Sign up
            </Link>
            <span className="text-zinc-700">·</span>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 hover:text-white"
            >
              Dashboard
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
