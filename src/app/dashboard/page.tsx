'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Package, DollarSign, Eye, Edit, Trash2, ExternalLink } from 'lucide-react'
import { Navbar } from '@/components'
import { Button, Card, Badge, CategoryBadge } from '@/components/ui'
import { MidwayMeter } from '@/components/MidwayMeter'
import { useAuth, useMyListings, useDeleteListing } from '@/hooks'
import type { Listing } from '@/types'

function ListingRow({ listing, onDelete }: { listing: Listing; onDelete: (id: string) => void }) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(listing.price)

  const statusColors = {
    active: 'success',
    sold: 'danger',
    draft: 'warning',
  } as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 border-b border-zinc-800 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-white">{listing.title}</h3>
          <CategoryBadge category={listing.category} />
          <Badge variant={statusColors[listing.status]}>{listing.status}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            {formattedPrice}
          </span>
          <MidwayMeter percent={listing.completion_percent} size="sm" showLabel={false} className="w-24" />
          <span>{listing.completion_percent}%</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Link href={`/listing/${listing.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
        <Link href={`/dashboard/edit/${listing.id}`}>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(listing.id)}
          className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { listings, loading, refetch } = useMyListings()
  const { deleteListing } = useDeleteListing()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteListing(id)
        refetch()
      } catch (error) {
        console.error('Failed to delete listing:', error)
      }
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

  const activeListings = listings.filter((l) => l.status === 'active')
  const totalValue = listings.reduce((sum, l) => sum + l.price, 0)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-white">Seller Dashboard</h1>
            <p className="text-zinc-400">Manage your project listings</p>
          </motion.div>
          <Link href="/dashboard/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Listing
            </Button>
          </Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card hover={false} className="p-6">
              <div className="mb-2 flex items-center gap-2 text-zinc-400">
                <Package className="h-5 w-5" />
                <span>Total Listings</span>
              </div>
              <p className="text-3xl font-bold text-white">{listings.length}</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card hover={false} className="p-6">
              <div className="mb-2 flex items-center gap-2 text-zinc-400">
                <Eye className="h-5 w-5" />
                <span>Active</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400">{activeListings.length}</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card hover={false} className="p-6">
              <div className="mb-2 flex items-center gap-2 text-zinc-400">
                <DollarSign className="h-5 w-5" />
                <span>Total Value</span>
              </div>
              <p className="text-3xl font-bold text-violet-400">
                ${totalValue.toLocaleString()}
              </p>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card hover={false} className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Your Listings</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : listings.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
                <h3 className="mb-2 text-lg font-medium text-white">No listings yet</h3>
                <p className="mb-6 text-zinc-400">
                  Start selling your unfinished projects today!
                </p>
                <Link href="/dashboard/new">
                  <Button>
                    <Plus className="h-4 w-4" />
                    Create your first listing
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {listings.map((listing) => (
                  <ListingRow key={listing.id} listing={listing} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
