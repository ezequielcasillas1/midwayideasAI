-- Reviews and Flags System Tables
-- Run this AFTER 000_listings.sql and 001_membership_system.sql

-- Listing reviews table
CREATE TABLE IF NOT EXISTS listing_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  points_deducted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, reviewer_id)
);

-- User flags table
CREATE TABLE IF NOT EXISTS user_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flagger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'dismissed')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_reviews_listing_id ON listing_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_reviews_seller_id ON listing_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_listing_reviews_reviewer_id ON listing_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_user_flags_user_id ON user_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flags_status ON user_flags(status);

-- RLS Policies
ALTER TABLE listing_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flags ENABLE ROW LEVEL SECURITY;

-- Listing reviews: Anyone can read, authenticated users can create
CREATE POLICY "Anyone can view listing reviews" ON listing_reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON listing_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Service role can manage reviews" ON listing_reviews
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User flags: Users can create flags, only admins can view/manage all
CREATE POLICY "Users can create flags" ON user_flags
  FOR INSERT WITH CHECK (auth.uid() = flagger_id);

CREATE POLICY "Users can view their own flags" ON user_flags
  FOR SELECT USING (auth.uid() = flagger_id OR auth.uid() = user_id);

CREATE POLICY "Service role can manage flags" ON user_flags
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
