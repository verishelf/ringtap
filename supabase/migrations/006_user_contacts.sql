-- In-app saved contacts (profiles saved by the current user)
-- Owner = the user who saved the contact; contact_user_id = the profile they saved

CREATE TABLE IF NOT EXISTS user_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id, contact_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_contacts_owner ON user_contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_contacts_created ON user_contacts(created_at DESC);

ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;

-- Owner can only manage their own contacts; no public access
CREATE POLICY "Owner can insert own contacts"
  ON user_contacts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can select own contacts"
  ON user_contacts FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner can delete own contacts"
  ON user_contacts FOR DELETE
  USING (auth.uid() = owner_id);

-- No UPDATE policy (contacts are append-only; re-save = delete + insert if needed)
-- Block all public/unauthenticated access by default (no SELECT without auth.uid())
