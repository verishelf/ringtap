/**
 * Fetches nearby map events for the Events tab.
 * Uses Supabase RPC get_nearby_map_events.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getNearbyMapEvents, type MapEvent } from '@/lib/api';

const NEARBY_RADIUS_KM = 25;
const POLL_INTERVAL_MS = 60_000;

export type UseNearbyEventsOptions = {
  centerLat: number | null;
  centerLon: number | null;
  enabled: boolean;
  pollIntervalMs?: number;
};

export function useNearbyEvents({
  centerLat,
  centerLon,
  enabled,
  pollIntervalMs = POLL_INTERVAL_MS,
}: UseNearbyEventsOptions) {
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNearby = useCallback(async () => {
    if (centerLat == null || centerLon == null || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getNearbyMapEvents(centerLat, centerLon, NEARBY_RADIUS_KM);
      setEvents(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [centerLat, centerLon, enabled]);

  useEffect(() => {
    fetchNearby();
    if (!enabled || centerLat == null || centerLon == null) return;
    intervalRef.current = setInterval(fetchNearby, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [fetchNearby, enabled, centerLat, centerLon, pollIntervalMs]);

  return { events, loading, error, refetch: fetchNearby };
}
