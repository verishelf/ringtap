-- Contact exchanges: when user A views user B's profile and shares their info (name, phone, email)
-- from_user_id = who shared; to_user_id = profile owner who receives the info

CREATE TABLE IF NOT EXISTS contact_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_exchanges_to_user ON contact_exchanges(to_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_exchanges_from_user ON contact_exchanges(from_user_id);

ALTER TABLE contact_exchanges ENABLE ROW LEVEL SECURITY;

-- Users can insert when they are the sender (from_user_id)
CREATE POLICY "Users can insert own exchange"
  ON contact_exchanges FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Users can read exchanges they received (to_user_id)
CREATE POLICY "Users can read exchanges they received"
  ON contact_exchanges FOR SELECT
  USING (auth.uid() = to_user_id);
