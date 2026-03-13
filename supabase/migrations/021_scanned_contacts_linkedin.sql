-- Add linkedin column to scanned_contacts for AI-extracted LinkedIn URLs
ALTER TABLE scanned_contacts ADD COLUMN IF NOT EXISTS linkedin TEXT DEFAULT '';
