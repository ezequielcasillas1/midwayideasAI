'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  ExternalLink, 
  Github, 
  Calendar, 
  User, 
  DollarSign,
  Mail,
  Share2,
  Heart,
  AlertCircle,
  ShoppingCart
} from 'lucide-react'
import { Navbar } from '@/components'
import { Button, Badge, CategoryBadge, Card } from '@/components/ui'
import { MidwayMeter } from '@/components/MidwayMeter'
import { InterestButton } from '@/components/InterestButton'
import { BuyNowButton } from '@/components/BuyNowButton'
import { useListing, useAuth } from '@/hooks'
import { supabase } from '@/lib/supabase'

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const { listing, loading, error } = useListing(params.id)
  const { user } = useAuth()
  const [sellerHasPayments, setSellerHasPayments] = useState(false)

  useEffect(() => {
    if (listing?.seller_id) {
      checkSellerPayments(listing.seller_id)
    }
  }, [listing?.seller_id])

  async function checkSellerPayments(sellerId: string) {
    const { data } = await supabase
      .from('connected_accounts')
      .select('charges_enabled, payouts_enabled')
      .eq('user_id', sellerId)
      .single()

    setSellerHasPayments(data?.charges_enabled && data?.payouts_enabled)
  }

  const isOwnListing = user?.id === listing?.seller_id

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center pt-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center pt-16">
          <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
          <h2 className="mb-2 text-xl font-semibold text-white">Listing not found</h2>
          <p className="mb-6 text-zinc-400">This project may have been removed or sold.</p>
          <Link href="/browse">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back to browse
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(listing.price)

  const formattedDate = new Date(listing.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <Link
          href="/browse"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to browse
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-800">
              <div className="relative aspect-video w-full bg-zinc-800">
                {listing.images?.[0] ? (
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-8xl opacity-20">🚀</div>
                  </div>
                )}
              </div>
              {listing.images && listing.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-4">
                  {listing.images.map((img, i) => (
                    <div
                      key={i}
                      className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-700"
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <CategoryBadge category={listing.category} />
              {listing.status === 'sold' && <Badge variant="danger">Sold</Badge>}
              <span className="text-sm text-zinc-500">
                <Calendar className="mr-1 inline-block h-4 w-4" />
                Listed {formattedDate}
              </span>
            </div>

            <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {listing.title}
            </h1>

            <div className="mb-8 flex flex-wrap gap-2">
              {listing.tech_stack.map((tech) => (
                <Badge key={tech}>{tech}</Badge>
              ))}
            </div>

            <Card hover={false} className="mb-8 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Project Completion</h2>
              <MidwayMeter percent={listing.completion_percent} size="lg" />
            </Card>

            <div className="prose prose-invert max-w-none">
              <h2 className="mb-4 text-lg font-semibold text-white">Description</h2>
              <p className="whitespace-pre-wrap text-zinc-300">{listing.description}</p>
            </div>

            {(listing.repo_url || listing.demo_url) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {listing.repo_url && (
                  <a href={listing.repo_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary">
                      <Github className="h-4 w-4" />
                      View Repository
                    </Button>
                  </a>
                )}
                {listing.demo_url && (
                  <a href={listing.demo_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary">
                      <ExternalLink className="h-4 w-4" />
                      Live Demo
                    </Button>
                  </a>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <Card hover={false} className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm text-zinc-400">Price</span>
                <div className="flex items-center gap-1 text-2xl font-bold text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                  {formattedPrice}
                </div>
              </div>

              {listing.status === 'active' && !isOwnListing ? (
                <div className="space-y-3">
                  {sellerHasPayments && (
                    <BuyNowButton
                      listingId={listing.id}
                      listingTitle={listing.title}
                      price={listing.price}
                      sellerHasPayments={sellerHasPayments}
                      className="w-full"
                    />
                  )}
                  
                  <InterestButton
                    listingId={listing.id}
                    className="w-full"
                    variant="default"
                  />
                  
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                  
                  {!sellerHasPayments && (
                    <p className="text-center text-xs text-zinc-500">
                      Direct payment not available. Express interest to contact seller.
                    </p>
                  )}
                </div>
              ) : listing.status === 'active' && isOwnListing ? (
                <div className="rounded-lg bg-zinc-800 p-4 text-center">
                  <p className="font-medium text-zinc-300">This is your listing</p>
                  <Link href="/dashboard" className="mt-2 inline-block text-sm text-violet-400 hover:text-violet-300">
                    Manage in dashboard
                  </Link>
                </div>
              ) : (
                <div className="rounded-lg bg-zinc-800 p-4 text-center">
                  <p className="font-medium text-zinc-300">This project has been sold</p>
                </div>
              )}
            </Card>

            {listing.seller && (
              <Card hover={false} className="p-6">
                <h3 className="mb-4 font-semibold text-white">Seller</h3>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                    {listing.seller.avatar_url ? (
                      <Image
                        src={listing.seller.avatar_url}
                        alt=""
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="h-6 w-6 text-zinc-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {listing.seller.display_name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-zinc-400">
                      Member since {new Date(listing.seller.created_at).getFullYear()}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Card hover={false} className="p-6">
              <h3 className="mb-4 font-semibold text-white">Quick Facts</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-400">Category</dt>
                  <dd className="text-white capitalize">{listing.category}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-400">Completion</dt>
                  <dd className="text-white">{listing.completion_percent}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-400">Tech Stack</dt>
                  <dd className="text-white">{listing.tech_stack.length} technologies</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-400">Has Demo</dt>
                  <dd className="text-white">{listing.demo_url ? 'Yes' : 'No'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-400">Has Repo</dt>
                  <dd className="text-white">{listing.repo_url ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
