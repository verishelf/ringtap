/**
 * Location service for Networking Map (Pro).
 * Handles permission, current position, and optional periodic updates to Supabase.
 */

import * as Location from 'expo-location';
import { upsertMapPresence } from '@/lib/api';

const LOCATION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.Balanced,
  maximumAge: 30000,
};

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function getLocationPermissionStatus(): Promise<LocationPermissionStatus> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const position = await Location.getCurrentPositionAsync(LOCATION_OPTIONS);
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

export type UpdatePresenceParams = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  latitude: number;
  longitude: number;
};

/**
 * Save current user's location to Supabase (map_presence). Call every ~60s when map is active.
 */
export async function updateMapPresence(params: UpdatePresenceParams): Promise<boolean> {
  const result = await upsertMapPresence(
    params.userId,
    params.name,
    params.avatarUrl,
    params.latitude,
    params.longitude
  );
  return result.success;
}

const POLL_INTERVAL_MS = 30_000;

export function startLocationPolling(
  params: Omit<UpdatePresenceParams, 'latitude' | 'longitude'>,
  onError?: () => void
): () => void {
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const tick = async () => {
    const coords = await getCurrentCoordinates();
    if (!coords) {
      onError?.();
      return;
    }
    const ok = await updateMapPresence({ ...params, ...coords });
    if (!ok) onError?.();
  };

  tick();
  intervalId = setInterval(tick, POLL_INTERVAL_MS);

  return () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  };
}
