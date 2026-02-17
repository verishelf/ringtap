-- Calendly OAuth tokens per RingTap user
CREATE TABLE IF NOT EXISTS calendly_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  calendly_user_uri TEXT,
  calendly_organization TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendly_users_user_id ON calendly_users(user_id);
CREATE INDEX IF NOT EXISTS idx_calendly_users_calendly_uri ON calendly_users(calendly_user_uri);

ALTER TABLE calendly_users ENABLE ROW LEVEL SECURITY;

-- Only service role can access (Edge Functions use service role)
CREATE POLICY "Service role full access calendly_users" ON calendly_users
  FOR ALL USING (auth.role() = 'service_role');
