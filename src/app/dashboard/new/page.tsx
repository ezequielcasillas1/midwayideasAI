'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Plus, X, Upload, ImageIcon, Lightbulb } from 'lucide-react'
import { Navbar, SellingAdviceModal } from '@/components'
import { Button, Input, Select, Card } from '@/components/ui'
import { MidwayMeter } from '@/components/MidwayMeter'
import { useAuth, useCreateListing, useCaptcha, useCaptchaBypass } from '@/hooks'
import { HCaptcha } from '@/components/HCaptcha'
import { shouldRequireCaptcha } from '@/lib/captcha-config'
import { useMembership } from '@/features/membership/hooks/useMembership'
import type { Category, ListingStatus } from '@/types'

const MAX_IMAGES = 3
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

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
]

interface ImagePreview {
  file: File
  url: string
}

export default function NewListingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { createListing, loading: createLoading } = useCreateListing()
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  const [images, setImages] = useState<ImagePreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [showAdvice, setShowAdvice] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState('')
  const [captchaBypassed, setCaptchaBypassed] = useState(false)
  const { verifyToken } = useCaptcha()
  const { membership } = useMembership()
  const { canBypass, handleBypass, currentPoints } = useCaptchaBypass()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.url))
    }
  }, [images])

  const handleFiles = (files: FileList | null) => {
    if (!files) return

    const validFiles: ImagePreview[] = []
    const remainingSlots = MAX_IMAGES - images.length

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (ACCEPTED_TYPES.includes(file.type)) {
        validFiles.push({
          file,
          url: URL.createObjectURL(file),
        })
      }
    })

    if (validFiles.length > 0) {
      setImages((prev) => [...prev, ...validFiles])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const addTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setTechStack([...techStack, techInput.trim()])
      setTechInput('')
    }
  }

  const removeTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech))
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCaptchaError('')

    if (!title || !description || !price) {
      setError('Please fill in all required fields')
      return
    }

    if (shouldRequireCaptcha() && !captchaToken && !captchaBypassed) {
      setCaptchaError('Please complete the captcha verification')
      return
    }

    if (shouldRequireCaptcha() && captchaToken && !captchaBypassed) {
      const isValid = await verifyToken(captchaToken)
      if (!isValid) {
        setCaptchaError('Captcha verification failed, please try again')
        setCaptchaToken(null)
        return
      }
    }

    try {
      const imageUrls = await Promise.all(
        images.map((img) => convertToBase64(img.file))
      )

      await createListing({
        title,
        description,
        category,
        price: Number(price),
        completion_percent: completionPercent,
        tech_stack: techStack,
        repo_url: repoUrl || null,
        demo_url: demoUrl || null,
        images: imageUrls,
        status,
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create listing')
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center pt-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
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
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Create New Listing</h1>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAdvice(true)}
              className="gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Advice on Selling
            </Button>
          </div>

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
                    placeholder="Describe your project, what's built, what's remaining..."
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
              <h2 className="mb-6 text-lg font-semibold text-white">Project Images</h2>
              <p className="mb-4 text-sm text-zinc-400">
                Add up to {MAX_IMAGES} images (PNG or JPEG). First image will be the cover.
              </p>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => images.length < MAX_IMAGES && fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-violet-500 bg-violet-500/10'
                    : images.length >= MAX_IMAGES
                    ? 'cursor-not-allowed border-zinc-700 bg-zinc-800/30'
                    : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                  disabled={images.length >= MAX_IMAGES}
                />
                <Upload className="mx-auto mb-3 h-8 w-8 text-zinc-500" />
                {images.length >= MAX_IMAGES ? (
                  <p className="text-sm text-zinc-500">Maximum images reached</p>
                ) : (
                  <>
                    <p className="text-sm text-zinc-300">
                      Drag & drop or click to upload
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      PNG, JPEG up to 5MB each
                    </p>
                  </>
                )}
              </div>

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {images.map((img, index) => (
                    <div
                      key={img.url}
                      className="group relative aspect-video overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800"
                    >
                      <Image
                        src={img.url}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {index === 0 && (
                        <span className="absolute left-2 top-2 rounded bg-violet-600 px-2 py-0.5 text-xs font-medium text-white">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(index)
                        }}
                        className="absolute right-2 top-2 rounded-full bg-zinc-900/80 p-1.5 text-zinc-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

            {shouldRequireCaptcha() && !captchaBypassed && (
              <Card hover={false} className="mb-6 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Verification</h2>
                <HCaptcha
                  onVerify={(token) => {
                    setCaptchaToken(token)
                    setCaptchaError('')
                  }}
                  onExpire={() => {
                    setCaptchaToken(null)
                    setCaptchaError('Captcha expired, please verify again')
                  }}
                  onError={(err) => setCaptchaError(`Captcha error: ${err}`)}
                  onBypass={async () => {
                    const success = await handleBypass()
                    if (success) {
                      setCaptchaBypassed(true)
                      setCaptchaError('')
                    }
                    return success
                  }}
                  canBypass={canBypass}
                  currentPoints={currentPoints}
                  showBypassOption={true}
                />
                {captchaError && (
                  <p className="mt-2 text-center text-sm text-red-400">{captchaError}</p>
                )}
                {captchaToken && (
                  <p className="mt-2 text-center text-sm text-green-400">Verified</p>
                )}
              </Card>
            )}
            
            {captchaBypassed && (
              <Card hover={false} className="mb-6 border-green-500/30 p-6">
                <div className="flex items-center gap-3 text-green-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Verification bypassed with points</span>
                </div>
              </Card>
            )}

            <div className="flex gap-4">
              <Link href="/dashboard" className="flex-1">
                <Button type="button" variant="secondary" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={createLoading} className="flex-1">
                <Save className="h-4 w-4" />
                Create Listing
              </Button>
            </div>
          </form>
        </motion.div>
      </main>

      <SellingAdviceModal isOpen={showAdvice} onClose={() => setShowAdvice(false)} />
    </div>
  )
}
