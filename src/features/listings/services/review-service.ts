import { supabase } from '@/lib/supabase'
import type { ListingReview } from '@/types'
import { deductPoints } from '@/features/membership/services/points-service'
import { NEGATIVE_REVIEW_PENALTY, NEGATIVE_REVIEW_THRESHOLD } from '@/lib/membership-config'

export interface ReviewResult {
  review: ListingReview
  pointsDeducted: number
}

export async function submitReview(
  listingId: string,
  reviewerId: string,
  sellerId: string,
  stars: number,
  comment: string | null
): Promise<ReviewResult> {
  if (stars < 1 || stars > 5) {
    throw new Error('Stars must be between 1 and 5')
  }

  if (reviewerId === sellerId) {
    throw new Error('Cannot review your own listing')
  }

  const { data: existing } = await supabase
    .from('listing_reviews')
    .select('id')
    .eq('listing_id', listingId)
    .eq('reviewer_id', reviewerId)
    .single()

  if (existing) {
    throw new Error('You have already reviewed this listing')
  }

  const shouldDeduct = stars <= NEGATIVE_REVIEW_THRESHOLD
  let pointsDeducted = 0

  if (shouldDeduct) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('points')
      .eq('user_id', sellerId)
      .single()

    if (membership) {
      const result = await deductPoints(
        sellerId,
        NEGATIVE_REVIEW_PENALTY,
        `Low rating (${stars} stars) on listing`,
        membership.points
      )
      pointsDeducted = result.deductedPoints
    }
  }

  const { data: review, error } = await supabase
    .from('listing_reviews')
    .insert({
      listing_id: listingId,
      reviewer_id: reviewerId,
      seller_id: sellerId,
      stars,
      comment,
      points_deducted: shouldDeduct && pointsDeducted > 0,
    })
    .select()
    .single()

  if (error) throw error

  return { review, pointsDeducted }
}

export async function getReviewsForListing(listingId: string): Promise<ListingReview[]> {
  const { data, error } = await supabase
    .from('listing_reviews')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getReviewsForSeller(sellerId: string): Promise<ListingReview[]> {
  const { data, error } = await supabase
    .from('listing_reviews')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAverageRating(sellerId: string): Promise<{ average: number; count: number }> {
  const { data, error } = await supabase
    .from('listing_reviews')
    .select('stars')
    .eq('seller_id', sellerId)

  if (error) throw error

  const reviews = data || []
  if (reviews.length === 0) {
    return { average: 0, count: 0 }
  }

  const total = reviews.reduce((sum, r) => sum + r.stars, 0)
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  }
}
