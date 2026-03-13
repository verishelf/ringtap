/**
 * Map view showing nearby events as markers.
 */

import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { MapEvent } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const mapDarkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#71717a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#27272a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#3f3f46' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f12' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#141416' }] },
];

function fitRegion(
  center: { latitude: number; longitude: number },
  points: { latitude: number; longitude: number }[],
  padding = 1.5
): { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } {
  const all = [center, ...points];
  const lats = all.map((p) => p.latitude);
  const lons = all.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latDelta = Math.max((maxLat - minLat) * padding, 0.02);
  const lonDelta = Math.max((maxLon - minLon) * padding, 0.02);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}

export type EventsMapViewProps = {
  currentLocation: { latitude: number; longitude: number } | null;
  events: MapEvent[];
};

export function EventsMapView({ currentLocation, events }: EventsMapViewProps) {
  const colors = useThemeColors();
  const mapRef = useRef<MapView>(null);
  const center = currentLocation ?? (events[0] ? { latitude: events[0].latitude, longitude: events[0].longitude } : null);
  const region = center
    ? fitRegion(center, events.map((e) => ({ latitude: e.latitude, longitude: e.longitude })))
    : undefined;

  useEffect(() => {
    if (mapRef.current && center && events.length > 0) {
      const coords = currentLocation
        ? [currentLocation, ...events.map((e) => ({ latitude: e.latitude, longitude: e.longitude }))]
        : events.map((e) => ({ latitude: e.latitude, longitude: e.longitude }));
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 24, right: 24, bottom: 24, left: 24 },
        animated: true,
      });
    }
  }, [events.length, currentLocation?.latitude, currentLocation?.longitude]);

  if (!center) return null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation={!!currentLocation}
        showsMyLocationButton
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        customMapStyle={mapDarkStyle}
      >
        {events.map((ev) => (
          <Marker
            key={ev.id}
            coordinate={{ latitude: ev.latitude, longitude: ev.longitude }}
            title={ev.name}
            description={ev.description || undefined}
          >
            <View style={[styles.markerWrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Ionicons name="calendar" size={20} color={colors.accent} />
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 200 },
  markerWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
