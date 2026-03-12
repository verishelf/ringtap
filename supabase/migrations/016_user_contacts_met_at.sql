-- Add "met at" location to saved contacts (captured when user taps Save Contact)

ALTER TABLE user_contacts
  ADD COLUMN IF NOT EXISTS met_at_location TEXT;

-- Allow owner to update met_at_location (e.g. if we add edit later)
CREATE POLICY "Owner can update own contacts"
  ON user_contacts FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
