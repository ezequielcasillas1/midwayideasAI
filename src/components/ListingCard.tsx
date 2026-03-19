'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ExternalLink, Github, DollarSign } from 'lucide-react'
import { Card, Badge, CategoryBadge } from '@/components/ui'
import { MidwayMeter } from './MidwayMeter'
import type { Listing } from '@/types'

interface ListingCardProps {
  listing: Listing
  index?: number
}

export function ListingCard({ listing, index = 0 }: ListingCardProps) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(listing.price)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/listing/${listing.id}`}>
        <Card glow className="group h-full overflow-hidden">
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
            {listing.images?.[0] ? (
              <Image
                src={listing.images[0]}
                alt={listing.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-6xl opacity-20">🚀</div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <CategoryBadge category={listing.category} />
              <div className="flex gap-1.5">
                {listing.repo_url && (
                  <div className="rounded-full bg-zinc-900/80 p-1.5 backdrop-blur-sm">
                    <Github className="h-3.5 w-3.5 text-zinc-300" />
                  </div>
                )}
                {listing.demo_url && (
                  <div className="rounded-full bg-zinc-900/80 p-1.5 backdrop-blur-sm">
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-300" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-5">
            <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-white transition-colors group-hover:text-violet-400">
              {listing.title}
            </h3>
            <p className="mb-4 line-clamp-2 text-sm text-zinc-400">
              {listing.description}
            </p>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {listing.tech_stack.slice(0, 4).map((tech) => (
                <Badge key={tech} variant="default" className="text-xs">
                  {tech}
                </Badge>
              ))}
              {listing.tech_stack.length > 4 && (
                <Badge variant="default" className="text-xs">
                  +{listing.tech_stack.length - 4}
                </Badge>
              )}
            </div>

            <MidwayMeter percent={listing.completion_percent} size="sm" />

            <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <DollarSign className="h-4 w-4" />
                <span className="text-lg font-bold">{formattedPrice}</span>
              </div>
              {listing.status === 'sold' && (
                <Badge variant="danger">Sold</Badge>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
