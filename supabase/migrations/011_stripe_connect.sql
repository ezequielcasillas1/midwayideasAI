-- Stripe Connect & Escrow System
-- Enables marketplace payments between buyers and sellers

-- Connected Accounts (Stripe Connect Express)
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  details_submitted BOOLEAN NOT NULL DEFAULT false,
  business_type TEXT,
  country TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Transactions (payment records)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  platform_fee INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
  seller_amount INTEGER NOT NULL CHECK (seller_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_transfer_id TEXT,
  stripe_charge_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'refunded', 'disputed', 'failed')),
  escrow_released_at TIMESTAMPTZ,
  buyer_confirmed_at TIMESTAMPTZ,
  refund_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Escrow Holds (tracking funds in escrow)
CREATE TABLE IF NOT EXISTS escrow_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'release_requested', 'released', 'refunded')),
  release_requested_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(transaction_id)
);

-- Payout Records (for tracking seller payouts)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payout_id TEXT UNIQUE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'paid', 'failed', 'canceled')),
  arrival_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_stripe_id ON connected_accounts(stripe_account_id);

CREATE INDEX IF NOT EXISTS idx_transactions_listing_id ON transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_intent ON transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_escrow_holds_transaction_id ON escrow_holds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_status ON escrow_holds(status);

CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_connected_accounts_updated_at ON connected_accounts;
CREATE TRIGGER update_connected_accounts_updated_at
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Connected Accounts: Users can view their own
CREATE POLICY "Users can view own connected account" ON connected_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Transactions: Buyers and sellers can view their transactions
CREATE POLICY "Users can view own transactions as buyer" ON transactions
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can view own transactions as seller" ON transactions
  FOR SELECT USING (auth.uid() = seller_id);

-- Escrow: Participants can view escrow for their transactions
CREATE POLICY "Users can view escrow for their transactions" ON escrow_holds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transactions t 
      WHERE t.id = escrow_holds.transaction_id 
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

-- Payouts: Users can view their own payouts
CREATE POLICY "Users can view own payouts" ON payouts
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all
CREATE POLICY "Service role manages connected_accounts" ON connected_accounts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages transactions" ON transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages escrow_holds" ON escrow_holds
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages payouts" ON payouts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to check if seller can receive payments
CREATE OR REPLACE FUNCTION can_receive_payments(seller_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  account_record RECORD;
BEGIN
  SELECT * INTO account_record 
  FROM connected_accounts 
  WHERE user_id = seller_user_id;
  
  IF account_record IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN account_record.charges_enabled AND account_record.payouts_enabled;
END;
$$ LANGUAGE plpgsql;
