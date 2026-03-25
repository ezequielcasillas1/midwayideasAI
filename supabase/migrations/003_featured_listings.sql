-- Featured Listings System
-- Run this AFTER 002_reviews_and_flags.sql

-- Add featured columns to listings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Index for featured listings queries
CREATE INDEX IF NOT EXISTS idx_listings_is_featured ON listings(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_listings_featured_until ON listings(featured_until) WHERE featured_until IS NOT NULL;

-- Function to auto-expire featured listings
CREATE OR REPLACE FUNCTION expire_featured_listings()
RETURNS void AS $$
BEGIN
  UPDATE listings 
  SET is_featured = false, featured_until = NULL
  WHERE is_featured = true 
    AND featured_until IS NOT NULL 
    AND featured_until < now();
END;
$$ language 'plpgsql' SECURITY DEFINER;
