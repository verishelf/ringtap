-- Event cover image (organizer can upload)

ALTER TABLE map_events ADD COLUMN IF NOT EXISTS image_url TEXT;
