-- Exclusive Community System
-- Run this AFTER 005_cofounder_system.sql

-- Community announcements table
CREATE TABLE IF NOT EXISTS community_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Announcement read tracking
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES community_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_announcements_published_at ON community_announcements(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_announcements_is_pinned ON community_announcements(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement_id ON announcement_reads(announcement_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_community_announcements_updated_at ON community_announcements;
CREATE TRIGGER update_community_announcements_updated_at
  BEFORE UPDATE ON community_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE community_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- Announcements: Sovereign members can view published announcements
CREATE POLICY "Sovereign members can view published announcements" ON community_announcements
  FOR SELECT USING (
    published_at IS NOT NULL 
    AND published_at <= now()
    AND EXISTS (
      SELECT 1 FROM memberships 
      WHERE memberships.user_id = auth.uid() 
      AND memberships.tier = 'sovereign'
    )
  );

CREATE POLICY "Service role can manage announcements" ON community_announcements
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Announcement reads: Users can manage their own reads
CREATE POLICY "Users can view own announcement reads" ON announcement_reads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can mark announcements as read" ON announcement_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage announcement reads" ON announcement_reads
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
