-- Analytics System Tables
-- Run this AFTER 003_featured_listings.sql

-- Listing views tracking table
CREATE TABLE IF NOT EXISTS listing_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_ip TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily aggregated stats for performance
CREATE TABLE IF NOT EXISTS listing_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  unique_viewers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, date)
);

-- User analytics summary (cached for dashboard)
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_views INTEGER NOT NULL DEFAULT 0,
  total_listings INTEGER NOT NULL DEFAULT 0,
  total_points_earned INTEGER NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_created_at ON listing_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_views_viewer_id ON listing_views(viewer_id) WHERE viewer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listing_stats_daily_listing_id ON listing_stats_daily(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_stats_daily_date ON listing_stats_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);

-- RLS Policies
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Listing views: Anyone can insert (tracking), owners can view their listings' views
CREATE POLICY "Anyone can record listing views" ON listing_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Listing owners can view their listing views" ON listing_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_views.listing_id 
      AND listings.seller_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage listing views" ON listing_views
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Daily stats: Owners can view their stats
CREATE POLICY "Listing owners can view daily stats" ON listing_stats_daily
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_stats_daily.listing_id 
      AND listings.seller_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage daily stats" ON listing_stats_daily
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User analytics: Users can view their own
CREATE POLICY "Users can view own analytics" ON user_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user analytics" ON user_analytics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to aggregate daily stats (run via cron or trigger)
CREATE OR REPLACE FUNCTION aggregate_daily_listing_stats(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
BEGIN
  INSERT INTO listing_stats_daily (listing_id, date, view_count, unique_viewers)
  SELECT 
    listing_id,
    target_date,
    COUNT(*) as view_count,
    COUNT(DISTINCT COALESCE(viewer_id::text, viewer_ip)) as unique_viewers
  FROM listing_views
  WHERE created_at >= target_date AND created_at < target_date + INTERVAL '1 day'
  GROUP BY listing_id
  ON CONFLICT (listing_id, date) 
  DO UPDATE SET 
    view_count = EXCLUDED.view_count,
    unique_viewers = EXCLUDED.unique_viewers;
END;
$$ language 'plpgsql' SECURITY DEFINER;
