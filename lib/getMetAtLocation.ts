/**
 * Get a short "met at" location string using device location (for saved contacts).
 * Returns null if permission denied, unavailable, or reverse geocode fails.
 */

import * as Location from 'expo-location';

const LOCATION_TIMEOUT_MS = 10000;

export async function getMetAtLocation(): Promise<string | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 60000,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Location timeout')), LOCATION_TIMEOUT_MS)
      ),
    ]);

    const { latitude, longitude } = position.coords;
    const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!result) return null;

    const parts: string[] = [];
    if (result.name?.trim()) parts.push(result.name.trim());
    if (result.street?.trim()) parts.push(result.street.trim());
    if (result.city?.trim()) parts.push(result.city.trim());
    if (result.region?.trim()) parts.push(result.region.trim());
    if (result.country?.trim()) parts.push(result.country.trim());

    const str = parts.filter(Boolean).join(', ');
    return str.length > 0 ? str : null;
  } catch {
    return null;
  }
}
