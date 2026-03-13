-- Map events: networking events nearby (Pro can create)

CREATE TABLE IF NOT EXISTS map_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_map_events_lat_lon ON map_events(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_map_events_date ON map_events(event_date);

ALTER TABLE map_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read events" ON map_events FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert events" ON map_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON map_events FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON map_events FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION get_nearby_map_events(
  center_lat DOUBLE PRECISION,
  center_lon DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 25,
  max_rows INT DEFAULT 50
)
RETURNS SETOF map_events
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM map_events
  WHERE event_date >= now() - interval '1 day'
    AND (
      6371 * 2 * asin(sqrt(
        sin(radians(latitude - center_lat) / 2) * sin(radians(latitude - center_lat) / 2)
        + cos(radians(center_lat)) * cos(radians(latitude))
        * sin(radians(longitude - center_lon) / 2) * sin(radians(longitude - center_lon) / 2)
      )) <= radius_km
    )
  ORDER BY event_date ASC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_map_events TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_map_events TO anon;
