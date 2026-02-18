-- Add scheduling_url to calendly_users (from Calendly /users/me)
ALTER TABLE calendly_users ADD COLUMN IF NOT EXISTS scheduling_url TEXT;
