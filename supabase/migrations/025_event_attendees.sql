-- Event attendees / RSVP for map events

CREATE TABLE IF NOT EXISTS event_attendees (
  event_id UUID NOT NULL REFERENCES map_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attending BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id);

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read attendees" ON event_attendees;
DROP POLICY IF EXISTS "Authenticated can upsert own attendance" ON event_attendees;

CREATE POLICY "Anyone can read attendees" ON event_attendees FOR SELECT USING (true);
CREATE POLICY "Authenticated can upsert own attendance" ON event_attendees FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
