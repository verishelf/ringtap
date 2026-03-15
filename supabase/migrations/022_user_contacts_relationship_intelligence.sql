-- Relationship intelligence: how we met, where, when, notes

ALTER TABLE user_contacts
  ADD COLUMN IF NOT EXISTS met_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS how_met TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;
