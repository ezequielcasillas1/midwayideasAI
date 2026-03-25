-- Prospects System
-- Tracks buyer interest in listings

CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'contacted', 'converted')),
  source TEXT NOT NULL CHECK (source IN ('message', 'interest_button')),
  message TEXT,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, user_id)
);

-- Notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_prospect', 'prospect_contacted', 'payment_received', 'escrow_released', 'transaction_complete')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prospects_listing_id ON prospects(listing_id);
CREATE INDEX IF NOT EXISTS idx_prospects_seller_id ON prospects(seller_id);
CREATE INDEX IF NOT EXISTS idx_prospects_user_id ON prospects(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON prospects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Updated_at trigger for prospects
DROP TRIGGER IF EXISTS update_prospects_updated_at ON prospects;
CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Prospects: Sellers can view prospects for their listings
CREATE POLICY "Sellers can view their prospects" ON prospects
  FOR SELECT USING (auth.uid() = seller_id);

-- Prospects: Users can view their own interest records
CREATE POLICY "Users can view own interests" ON prospects
  FOR SELECT USING (auth.uid() = user_id);

-- Prospects: Users can create interest (prospect) records
CREATE POLICY "Users can express interest" ON prospects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prospects: Sellers can update prospect status
CREATE POLICY "Sellers can update prospect status" ON prospects
  FOR UPDATE USING (auth.uid() = seller_id);

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Notifications: Users can mark their notifications as read
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all
CREATE POLICY "Service role manages prospects" ON prospects
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages notifications" ON notifications
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to calculate prospect score based on user profile
CREATE OR REPLACE FUNCTION calculate_prospect_score(prospect_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  user_record RECORD;
  membership_record RECORD;
BEGIN
  -- Get user data
  SELECT * INTO user_record FROM users WHERE id = prospect_user_id;
  SELECT * INTO membership_record FROM memberships WHERE user_id = prospect_user_id;
  
  IF user_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Profile completeness (20 pts max)
  IF user_record.bio IS NOT NULL THEN score := score + 8; END IF;
  IF user_record.avatar_url IS NOT NULL THEN score := score + 6; END IF;
  IF user_record.display_name IS NOT NULL THEN score := score + 6; END IF;
  
  -- Verification (35 pts max)
  IF user_record.phone_verified = true THEN score := score + 15; END IF;
  IF user_record.id_verified = true THEN score := score + 20; END IF;
  
  -- Budget range filled (10 pts)
  IF user_record.budget_range IS NOT NULL THEN score := score + 10; END IF;
  
  -- Membership tier (15 pts max)
  IF membership_record IS NOT NULL THEN
    CASE membership_record.tier
      WHEN 'sovereign' THEN score := score + 15;
      WHEN 'duke' THEN score := score + 12;
      WHEN 'baron' THEN score := score + 10;
      WHEN 'knight' THEN score := score + 5;
      ELSE score := score + 0;
    END CASE;
  END IF;
  
  -- Account age (10 pts max) - 1 pt per month, max 10
  IF user_record.created_at IS NOT NULL THEN
    score := score + LEAST(10, EXTRACT(MONTH FROM age(now(), user_record.created_at))::INTEGER);
  END IF;
  
  -- Social links (10 pts max)
  IF user_record.linkedin_url IS NOT NULL THEN score := score + 4; END IF;
  IF user_record.twitter_url IS NOT NULL THEN score := score + 3; END IF;
  IF user_record.website IS NOT NULL THEN score := score + 3; END IF;
  
  RETURN LEAST(100, score);
END;
$$ LANGUAGE plpgsql;
