/**
 * Fetches and optionally polls nearby RingTap users for the Networking Map (Pro).
 * Excludes current user. Uses Supabase RPC get_nearby_map_presence.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getNearbyMapPresence, type MapPresenceUser } from '@/lib/api';

const NEARBY_RADIUS_KM = 10;
const POLL_INTERVAL_MS = 60_000;

export type UseNearbyUsersOptions = {
  centerLat: number | null;
  centerLon: number | null;
  enabled: boolean;
  excludeUserId: string | null;
  pollIntervalMs?: number;
};

export function useNearbyUsers({
  centerLat,
  centerLon,
  enabled,
  excludeUserId,
  pollIntervalMs = POLL_INTERVAL_MS,
}: UseNearbyUsersOptions) {
  const [users, setUsers] = useState<MapPresenceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNearby = useCallback(async () => {
    if (centerLat == null || centerLon == null || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getNearbyMapPresence(
        centerLat,
        centerLon,
        NEARBY_RADIUS_KM,
        excludeUserId
      );
      setUsers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load nearby users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [centerLat, centerLon, enabled, excludeUserId]);

  useEffect(() => {
    fetchNearby();
    if (!enabled || centerLat == null || centerLon == null) return;
    intervalRef.current = setInterval(fetchNearby, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [fetchNearby, enabled, centerLat, centerLon, pollIntervalMs]);

  return { users, loading, error, refetch: fetchNearby };
}
