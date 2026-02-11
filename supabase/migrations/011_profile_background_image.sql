-- Profile background image (displayed above video on app and web profile)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS background_image_url TEXT;
