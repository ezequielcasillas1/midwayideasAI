'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Rocket, ArrowRight } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <Card hover={false} className="p-8">
          <div className="mb-8 text-center">
            <Link href="/" className="mb-6 inline-flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
                <Rocket className="h-6 w-6 text-white" />
              </div>
            </Link>
            <h1 className="mb-2 text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-zinc-400">Sign in to your MIDWAY account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-violet-500 focus:ring-violet-500"
                />
                <span className="text-sm text-zinc-400">Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-violet-400 hover:text-violet-300"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-violet-400 hover:text-violet-300">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
