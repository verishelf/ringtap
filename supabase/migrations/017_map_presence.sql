-- Networking Map: presence of Pro users for "People Nearby" (Pro feature)
-- One row per user; updated every ~60s by the app with current location.

CREATE TABLE IF NOT EXISTS map_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  last_active TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_map_presence_last_active ON map_presence(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_map_presence_lat_lon ON map_presence(latitude, longitude);

ALTER TABLE map_presence ENABLE ROW LEVEL SECURITY;

-- Users can insert/update/delete only their own row
CREATE POLICY "Users can insert own map presence"
  ON map_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own map presence"
  ON map_presence FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own map presence"
  ON map_presence FOR DELETE
  USING (auth.uid() = user_id);

-- Authenticated users can read all (for nearby discovery); exclude self in app
CREATE POLICY "Authenticated can read map presence"
  ON map_presence FOR SELECT
  USING (auth.role() = 'authenticated');

-- Haversine distance in km: 2 * 6371 * asin(sqrt(sin(radians(dlat)/2)^2 + cos(radians(lat1))*cos(radians(lat2))*sin(radians(dlon)/2)^2))
CREATE OR REPLACE FUNCTION get_nearby_map_presence(
  center_lat DOUBLE PRECISION,
  center_lon DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10,
  exclude_user_id UUID DEFAULT NULL,
  max_rows INT DEFAULT 100  -- applied as LIMIT 100 in body
)
RETURNS SETOF map_presence
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM map_presence
  WHERE (exclude_user_id IS NULL OR user_id != exclude_user_id)
    AND last_active > now() - interval '1 hour'
    AND (
      6371 * 2 * asin(sqrt(
        sin(radians(latitude - center_lat) / 2) * sin(radians(latitude - center_lat) / 2)
        + cos(radians(center_lat)) * cos(radians(latitude))
        * sin(radians(longitude - center_lon) / 2) * sin(radians(longitude - center_lon) / 2)
      )) <= radius_km
    )
  ORDER BY last_active DESC
  LIMIT 100;
$$;

-- Allow authenticated users to call the function
GRANT EXECUTE ON FUNCTION get_nearby_map_presence TO authenticated;
