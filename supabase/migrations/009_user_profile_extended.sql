-- Extended User Profile Fields
-- Adds rich profile data for prospects system

-- Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS budget_range TEXT CHECK (budget_range IN ('under_10k', '10k_50k', '50k_100k', '100k_plus', NULL));
ALTER TABLE users ADD COLUMN IF NOT EXISTS investment_timeline TEXT CHECK (investment_timeline IN ('immediately', '1_3_months', '3_6_months', 'exploring', NULL));

-- Index for users with complete profiles (for prospect scoring)
CREATE INDEX IF NOT EXISTS idx_users_profile_complete ON users(id) 
  WHERE bio IS NOT NULL AND budget_range IS NOT NULL;

-- Update the profile_complete calculation trigger
CREATE OR REPLACE FUNCTION update_profile_complete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_complete := (
    NEW.display_name IS NOT NULL AND
    NEW.avatar_url IS NOT NULL AND
    NEW.bio IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_complete ON users;
CREATE TRIGGER trigger_update_profile_complete
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_complete();

-- RLS: Users can update their own profile fields
CREATE POLICY "Users can update own profile extended" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
