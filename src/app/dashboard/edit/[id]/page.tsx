'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Plus, X, AlertCircle } from 'lucide-react'
import { Navbar } from '@/components'
import { Button, Input, Select, Card } from '@/components/ui'
import { MidwayMeter } from '@/components/MidwayMeter'
import { useAuth, useListing, useUpdateListing } from '@/hooks'
import type { Category, ListingStatus } from '@/types'

const categoryOptions = [
  { value: 'webapp', label: 'Web App' },
  { value: 'website', label: 'Website (Agency, E-commerce, etc.)' },
  { value: 'extension', label: 'Web App Extension' },
  { value: 'desktop', label: 'Desktop App' },
  { value: 'mobile', label: 'Mobile App' },
  { value: 'game', label: 'Game' },
  { value: 'api', label: 'API / Backend' },
  { value: 'os', label: 'Operating System' },
  { value: 'other', label: 'Other' },
]

const statusOptions = [
  { value: 'draft', label: 'Draft (not visible)' },
  { value: 'active', label: 'Active (visible to all)' },
  { value: 'sold', label: 'Sold' },
]

export default function EditListingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { listing, loading: listingLoading, error: listingError } = useListing(params.id)
  const { updateListing, loading: updateLoading } = useUpdateListing()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('webapp')
  const [price, setPrice] = useState('')
  const [completionPercent, setCompletionPercent] = useState(50)
  const [techStack, setTechStack] = useState<string[]>([])
  const [techInput, setTechInput] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [status, setStatus] = useState<ListingStatus>('draft')
  const [error, setError] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (listing && !initialized) {
      setTitle(listing.title)
      setDescription(listing.description)
      setCategory(listing.category)
      setPrice(String(listing.price))
      setCompletionPercent(listing.completion_percent)
      setTechStack(listing.tech_stack)
      setRepoUrl(listing.repo_url || '')
      setDemoUrl(listing.demo_url || '')
      setStatus(listing.status)
      setInitialized(true)
    }
  }, [listing, initialized])

  const addTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setTechStack([...techStack, techInput.trim()])
      setTechInput('')
    }
  }

  const removeTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title || !description || !price) {
      setError('Please fill in all required fields')
      return
    }

    try {
      await updateListing(params.id, {
        title,
        description,
        category,
        price: Number(price),
        completion_percent: completionPercent,
        tech_stack: techStack,
        repo_url: repoUrl || null,
        demo_url: demoUrl || null,
        status,
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update listing')
    }
  }

  if (authLoading || listingLoading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center pt-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      </div>
    )
  }

  if (listingError || !listing) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center pt-16">
          <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
          <h2 className="mb-2 text-xl font-semibold text-white">Listing not found</h2>
          <Link href="/dashboard">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-8 text-3xl font-bold text-white">Edit Listing</h1>

          <form onSubmit={handleSubmit}>
            <Card hover={false} className="mb-6 p-6">
              <h2 className="mb-6 text-lg font-semibold text-white">Basic Information</h2>
              
              {error && (
                <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <Input
                  label="Project Title *"
                  placeholder="e.g., E-commerce Dashboard"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Description *</label>
                  <textarea
                    placeholder="Describe your project..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="flex w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-base text-white placeholder:text-zinc-500 transition-all duration-200 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    required
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Select
                    label="Category"
                    options={categoryOptions}
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                  />
                  <Select
                    label="Status"
                    options={statusOptions}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ListingStatus)}
                  />
                </div>
              </div>
            </Card>

            <Card hover={false} className="mb-6 p-6">
              <h2 className="mb-6 text-lg font-semibold text-white">Pricing & Progress</h2>
              
              <div className="space-y-6">
                <Input
                  label="Price (USD) *"
                  type="number"
                  placeholder="500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />

                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-300">
                    Completion: {completionPercent}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={completionPercent}
                    onChange={(e) => setCompletionPercent(Number(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                  <MidwayMeter percent={completionPercent} showLabel={false} />
                </div>
              </div>
            </Card>

            <Card hover={false} className="mb-6 p-6">
              <h2 className="mb-6 text-lg font-semibold text-white">Tech Stack</h2>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., React, Node.js, PostgreSQL"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTech()
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={addTech}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {techStack.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-3 py-1 text-sm text-white"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeTech(tech)}
                          className="ml-1 text-zinc-400 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card hover={false} className="mb-8 p-6">
              <h2 className="mb-6 text-lg font-semibold text-white">Links (Optional)</h2>
              
              <div className="space-y-5">
                <Input
                  label="Repository URL"
                  type="url"
                  placeholder="https://github.com/..."
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
                <Input
                  label="Demo URL"
                  type="url"
                  placeholder="https://..."
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                />
              </div>
            </Card>

            <div className="flex gap-4">
              <Link href="/dashboard" className="flex-1">
                <Button type="button" variant="secondary" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={updateLoading} className="flex-1">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  )
}
