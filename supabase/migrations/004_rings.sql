-- RingTap: rings and ring_models for NFC activation
-- Run in Supabase SQL editor or via Supabase CLI

-- Ring models (reference data: 3D model URLs in storage)
CREATE TABLE IF NOT EXISTS ring_models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model_url TEXT,
  thumbnail_url TEXT
);

-- Populate example models (model_url/thumbnail_url point to storage after upload)
INSERT INTO ring_models (id, name, model_url, thumbnail_url) VALUES
  ('onyx_black', 'Onyx Black', NULL, NULL),
  ('titanium_silver', 'Titanium Silver', NULL, NULL),
  ('gold_mirror', 'Gold Mirror', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Physical rings (NFC chips) – chip_uid is the NFC chip identifier
CREATE TABLE IF NOT EXISTS rings (
  chip_uid TEXT PRIMARY KEY,
  ring_model TEXT REFERENCES ring_models(id) ON DELETE SET NULL,
  color TEXT,
  size TEXT,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('unclaimed', 'claimed')) DEFAULT 'unclaimed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rings_owner_user_id ON rings(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_rings_status ON rings(status);

-- RLS
ALTER TABLE ring_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE rings ENABLE ROW LEVEL SECURITY;

-- ring_models: public read (for activation UI)
CREATE POLICY "Anyone can read ring_models" ON ring_models FOR SELECT USING (true);

-- rings: user can read own; anyone can read for status (activation check)
CREATE POLICY "Anyone can read ring status" ON rings FOR SELECT USING (true);
CREATE POLICY "Users can update own rings" ON rings FOR UPDATE USING (auth.uid() = owner_user_id);
-- Insert/claim via service role or API (claim route)
CREATE POLICY "Service can insert rings" ON rings FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update rings for claim" ON rings FOR UPDATE USING (true);
