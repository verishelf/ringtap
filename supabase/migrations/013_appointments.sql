-- Calendly appointment events synced via webhook
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_uri TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  invitee_email TEXT,
  invitee_name TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked', -- booked, canceled, rescheduled
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_event_uri ON appointments(event_uri);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Users can read their own appointments
CREATE POLICY "Users can read own appointments" ON appointments
  FOR SELECT USING (auth.uid() = user_id);

-- Enable Realtime: In Supabase Dashboard → Database → Replication, add "appointments" to supabase_realtime
