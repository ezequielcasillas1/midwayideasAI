'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Rocket, ArrowRight, Check } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await signup(email, password, displayName)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card hover={false} className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">Check your email</h2>
            <p className="mb-6 text-zinc-400">
              We sent a confirmation link to <strong className="text-white">{email}</strong>
            </p>
            <Link href="/auth/login">
              <Button variant="secondary" className="w-full">
                Back to login
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
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
            <h1 className="mb-2 text-2xl font-bold text-white">Create an account</h1>
            <p className="text-zinc-400">Join MIDWAY and start trading projects</p>
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
              label="Display Name"
              type="text"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              icon={<User className="h-4 w-4" />}
              required
            />

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

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              required
            />

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-sm text-zinc-400">
                I agree to the{' '}
                <Link href="/terms" className="text-violet-400 hover:text-violet-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-violet-400 hover:text-violet-300">
                  Privacy Policy
                </Link>
              </span>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Create account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-violet-400 hover:text-violet-300">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
