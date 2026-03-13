/**
 * Hotspots Map: clusters nearby RingTap users into "networking hotspots".
 * Shows density markers; tap to see who's there and connect.
 */

import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { MapPresenceUser } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const CLUSTER_GRID = 0.008; // ~800m grid cells

function clusterUsers(users: MapPresenceUser[]): { center: { lat: number; lon: number }; users: MapPresenceUser[] }[] {
  const cells = new Map<string, MapPresenceUser[]>();
  for (const u of users) {
    const cellLat = Math.floor(u.latitude / CLUSTER_GRID) * CLUSTER_GRID;
    const cellLon = Math.floor(u.longitude / CLUSTER_GRID) * CLUSTER_GRID;
    const key = `${cellLat.toFixed(4)}_${cellLon.toFixed(4)}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key)!.push(u);
  }
  return Array.from(cells.entries()).map(([, us]) => {
    const lat = us.reduce((s, u) => s + u.latitude, 0) / us.length;
    const lon = us.reduce((s, u) => s + u.longitude, 0) / us.length;
    return { center: { lat, lon }, users: us };
  });
}

function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

export type HotspotsMapViewProps = {
  currentLocation: { latitude: number; longitude: number } | null;
  users: MapPresenceUser[];
  loading?: boolean;
  onConnect: (userId: string) => void;
  onViewProfile: (userId: string) => void;
  locationPermissionDenied?: boolean;
  locationEnabled?: boolean;
};

export function HotspotsMapView({
  currentLocation,
  users,
  loading,
  onConnect,
  onViewProfile,
  locationPermissionDenied,
  locationEnabled = true,
}: HotspotsMapViewProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<{ center: { lat: number; lon: number }; users: MapPresenceUser[] } | null>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const hotspots = useMemo(() => clusterUsers(users), [users]);

  const openSheet = useCallback((hotspot: { center: { lat: number; lon: number }; users: MapPresenceUser[] }) => {
    setSelectedHotspot(hotspot);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [sheetAnim]);

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedHotspot(null));
  }, [sheetAnim]);

  if (locationPermissionDenied) {
    return (
      <View style={[styles.deniedWrap, { backgroundColor: colors.background }]}>
        <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.deniedTitle, { color: colors.text }]}>Location needed</Text>
        <Text style={[styles.deniedText, { color: colors.textSecondary }]}>
          Enable location in Settings to discover networking hotspots.
        </Text>
      </View>
    );
  }

  if (!currentLocation) {
    return (
      <View style={[styles.deniedWrap, { backgroundColor: colors.background }]}>
        {!locationEnabled ? (
          <>
            <Ionicons name="locate-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.deniedTitle, { color: colors.text }]}>Location off</Text>
            <Text style={[styles.deniedText, { color: colors.textSecondary }]}>
              Turn on Location in Settings to see hotspots nearby.
            </Text>
          </>
        ) : loading ? (
          <Text style={[styles.deniedText, { color: colors.textSecondary }]}>Finding hotspots…</Text>
        ) : (
          <>
            <Ionicons name="locate-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.deniedTitle, { color: colors.text }]}>Location unavailable</Text>
            <Text style={[styles.deniedText, { color: colors.textSecondary }]}>
              We couldn&apos;t get your position. Check location permissions.
            </Text>
          </>
        )}
      </View>
    );
  }

  const region = {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  const hasHotspots = hotspots.length > 0;

  return (
    <View style={styles.container}>
      {!hasHotspots && !loading && (
        <View style={[styles.emptyOverlay, { backgroundColor: colors.background + 'F0' }]} pointerEvents="none">
          <Ionicons name="location-outline" size={32} color={colors.textSecondary} />
          <Text style={[styles.emptyOverlayText, { color: colors.textSecondary }]}>
            No hotspots nearby yet. Switch to People to see individual users.
          </Text>
        </View>
      )}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        customMapStyle={mapDarkStyle}
      >
        {hotspots.map((h, i) => (
          <Marker
            key={`${h.center.lat}_${h.center.lon}_${i}`}
            coordinate={{ latitude: h.center.lat, longitude: h.center.lon }}
            onPress={() => openSheet(h)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={[
                styles.hotspotMarker,
                {
                  backgroundColor: colors.accent,
                  borderColor: colors.surface,
                },
              ]}
            >
              <View style={[styles.hotspotBadge, { backgroundColor: colors.surface }]}>
                <Ionicons name="people" size={18} color={colors.accent} />
                <Text style={[styles.hotspotCount, { color: colors.text }]}>{h.users.length}</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Bottom sheet */}
      <Modal
        visible={!!selectedHotspot}
        transparent
        animationType="fade"
        onRequestClose={closeSheet}
      >
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.sheetOverlay,
            {
              opacity: sheetAnim,
              paddingBottom: insets.bottom + Layout.tabBarHeight,
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          {selectedHotspot && (
            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                  transform: [
                    {
                      translateY: sheetAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [400, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.sheetHandle, { backgroundColor: colors.borderLight }]} />
              <View style={styles.sheetContent}>
                <View style={styles.sheetHeader}>
                  <View style={[styles.sheetHeaderIcon, { backgroundColor: colors.accent + '33' }]}>
                    <Ionicons name="people" size={24} color={colors.accent} />
                  </View>
                  <View style={styles.sheetHeaderText}>
                    <Text style={[styles.sheetTitle, { color: colors.text }]}>
                      {selectedHotspot.users.length} RingTap user{selectedHotspot.users.length !== 1 ? 's' : ''} nearby
                    </Text>
                    <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                      Tap to connect or view profile
                    </Text>
                  </View>
                </View>
                <FlatList
                  data={selectedHotspot.users}
                  keyExtractor={(u) => u.userId}
                  style={styles.userList}
                  contentContainerStyle={styles.userListContent}
                  renderItem={({ item }) => (
                    <HotspotUserRow
                      user={item}
                      currentLocation={currentLocation}
                      onConnect={onConnect}
                      onViewProfile={onViewProfile}
                      onCloseSheet={closeSheet}
                      colors={colors}
                    />
                  )}
                />
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </Modal>
    </View>
  );
}

function HotspotUserRow({
  user,
  currentLocation,
  onConnect,
  onViewProfile,
  onCloseSheet,
  colors,
}: {
  user: MapPresenceUser;
  currentLocation: { latitude: number; longitude: number };
  onConnect: (userId: string) => void;
  onViewProfile: (userId: string) => void;
  onCloseSheet: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const dist = distanceKm(
    currentLocation.latitude,
    currentLocation.longitude,
    user.latitude,
    user.longitude
  );
  return (
    <View style={[styles.userRow, { borderColor: colors.borderLight }]}>
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={[styles.userAvatar, { borderColor: colors.borderLight }]} />
      ) : (
        <View style={[styles.userAvatarPlaceholder, { backgroundColor: colors.borderLight }]}>
          <Text style={[styles.userAvatarLetter, { color: colors.textSecondary }]}>
            {(user.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.userRowBody}>
        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
          {user.name || 'Unknown'}
        </Text>
        <Text style={[styles.userDistance, { color: colors.textSecondary }]}>
          {formatDistance(dist)}
        </Text>
      </View>
      <View style={styles.userRowActions}>
        <Pressable
          style={[styles.userActionBtn, { backgroundColor: colors.accent }]}
          onPress={() => {
            onCloseSheet();
            onConnect(user.userId);
          }}
        >
          <Ionicons name="person-add-outline" size={18} color="#0A0A0B" />
        </Pressable>
        <Pressable
          style={[styles.userActionBtn, { borderColor: colors.borderLight }]}
          onPress={() => {
            onCloseSheet();
            onViewProfile(user.userId);
          }}
        >
          <Ionicons name="person-outline" size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyOverlay: {
    position: 'absolute',
    bottom: 24,
    left: Layout.screenPadding,
    right: Layout.screenPadding,
    padding: 16,
    borderRadius: Layout.radiusMd,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  emptyOverlayText: { flex: 1, fontSize: 14 },
  deniedWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.screenPadding,
  },
  deniedTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  deniedText: { fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  hotspotMarker: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Layout.radiusSm,
  },
  hotspotCount: { fontSize: 14, fontWeight: '700' },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Layout.radiusXl,
    borderTopRightRadius: Layout.radiusXl,
    borderWidth: 1,
    maxHeight: '60%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetContent: { paddingHorizontal: Layout.screenPadding },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sheetHeaderText: { flex: 1, minWidth: 0 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  sheetSubtitle: { fontSize: 13, marginTop: 2 },
  userList: { maxHeight: 280 },
  userListContent: { paddingBottom: 16 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1 },
  userAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarLetter: { fontSize: 16, fontWeight: '700' },
  userRowBody: { flex: 1, marginLeft: 12, minWidth: 0 },
  userName: { fontSize: 16, fontWeight: '600' },
  userDistance: { fontSize: 13, marginTop: 2 },
  userRowActions: { flexDirection: 'row', gap: 8 },
  userActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
