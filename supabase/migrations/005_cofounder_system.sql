-- Co-founder Eligibility System
-- Run this AFTER 004_analytics_system.sql

-- Co-founder requests table
CREATE TABLE IF NOT EXISTS cofounder_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_discussion', 'approved', 'rejected')),
  message TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cofounder_requests_user_id ON cofounder_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cofounder_requests_status ON cofounder_requests(status);
CREATE INDEX IF NOT EXISTS idx_cofounder_requests_created_at ON cofounder_requests(created_at DESC);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_cofounder_requests_updated_at ON cofounder_requests;
CREATE TRIGGER update_cofounder_requests_updated_at
  BEFORE UPDATE ON cofounder_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cofounder_requests ENABLE ROW LEVEL SECURITY;

-- Users can view and create their own request
CREATE POLICY "Users can view own cofounder request" ON cofounder_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sovereign users can create cofounder request" ON cofounder_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM memberships 
      WHERE memberships.user_id = auth.uid() 
      AND memberships.tier = 'sovereign'
    )
  );

CREATE POLICY "Users can update own pending request" ON cofounder_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage cofounder requests" ON cofounder_requests
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
