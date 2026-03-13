-- Allow 'camera' as source for scanned_contacts (business card scanner)

-- Drop existing check (name may vary by Postgres version)
ALTER TABLE scanned_contacts DROP CONSTRAINT IF EXISTS scanned_contacts_source_check;

ALTER TABLE scanned_contacts
  ADD CONSTRAINT scanned_contacts_source_check
  CHECK (source IN ('nfc', 'qr', 'manual', 'camera'));
