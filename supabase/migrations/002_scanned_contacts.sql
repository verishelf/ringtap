-- Scanned contacts (saved business cards from NFC/QR or manual)
CREATE TABLE IF NOT EXISTS scanned_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  profile_url TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('nfc', 'qr', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scanned_contacts_user_id ON scanned_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_scanned_contacts_created_at ON scanned_contacts(created_at DESC);

ALTER TABLE scanned_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scanned contacts" ON scanned_contacts
  FOR ALL USING (auth.uid() = user_id);
