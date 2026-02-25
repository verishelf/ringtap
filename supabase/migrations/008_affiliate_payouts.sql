-- Payouts table for affiliate commission payouts
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code TEXT NOT NULL,
  amount_cents INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid, failed
  payout_method TEXT NOT NULL DEFAULT 'paypal',
  payout_details JSONB NOT NULL DEFAULT '{}', -- e.g. {"email": "affiliate@example.com"}
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_code ON affiliate_payouts(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);

-- Add commission tracking to referrals
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS amount_cents INT DEFAULT 500;
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS payout_id UUID REFERENCES affiliate_payouts(id) ON DELETE SET NULL;

-- $5 per Pro conversion
UPDATE affiliate_referrals SET amount_cents = 500 WHERE type = 'pro' AND (amount_cents IS NULL OR amount_cents = 0);

ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages payouts" ON affiliate_payouts FOR ALL USING (auth.role() = 'service_role');
