/**
 * Networking Map: shows nearby RingTap users on a map with markers.
 * Pro feature. Markers show avatar + name; tap opens bottom sheet (Connect / View Profile).
 */

import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { MapPresenceUser } from '@/lib/api';
import { getProfile } from '@/lib/api';
import type { UserProfile } from '@/lib/supabase/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INITIAL_DELTA = { latitudeDelta: 0.04, longitudeDelta: 0.04 };
const MARKER_SIZE = 44;
const SHEET_HANDLE_HEIGHT = 24;

export type NetworkingMapProps = {
  currentUserId: string | null;
  currentLocation: { latitude: number; longitude: number } | null;
  users: MapPresenceUser[];
  loading?: boolean;
  onConnect: (userId: string) => void;
  onViewProfile: (userId: string) => void;
  locationPermissionDenied?: boolean;
};

export function NetworkingMap({
  currentUserId,
  currentLocation,
  users,
  loading,
  onConnect,
  onViewProfile,
  locationPermissionDenied,
}: NetworkingMapProps) {
  const colors = useThemeColors();
  const mapRef = useRef<MapView>(null);
  const [selectedUser, setSelectedUser] = useState<MapPresenceUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const markerAnims = useRef<Record<string, Animated.Value>>({}).current;

  const region = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        ...INITIAL_DELTA,
      }
    : undefined;

  const getMarkerAnim = useCallback((id: string) => {
    if (!markerAnims[id]) markerAnims[id] = new Animated.Value(0);
    return markerAnims[id];
  }, [markerAnims]);

  useEffect(() => {
    users.forEach((u) => {
      const anim = getMarkerAnim(u.userId);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    });
  }, [users, getMarkerAnim]);

  const openSheet = useCallback(async (user: MapPresenceUser) => {
    setSelectedUser(user);
    setProfile(null);
    setProfileLoading(true);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
    try {
      const p = await getProfile(user.userId);
      setProfile(p ?? null);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [sheetAnim]);

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedUser(null);
      setProfile(null);
    });
  }, [sheetAnim]);

  if (locationPermissionDenied) {
    return (
      <View style={[styles.deniedWrap, { backgroundColor: colors.background }]}>
        <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.deniedTitle, { color: colors.text }]}>Location needed</Text>
        <Text style={[styles.deniedText, { color: colors.textSecondary }]}>
          Enable location in Settings to see people nearby on the map.
        </Text>
      </View>
    );
  }

  if (!currentLocation) {
    return (
      <View style={[styles.deniedWrap, { backgroundColor: colors.background }]}>
        {loading ? (
          <Text style={[styles.deniedText, { color: colors.textSecondary }]}>Getting your location…</Text>
        ) : (
          <>
            <Ionicons name="locate-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.deniedTitle, { color: colors.text }]}>Location unavailable</Text>
            <Text style={[styles.deniedText, { color: colors.textSecondary }]}>
              We couldn&apos;t get your position. Check location permissions and try again.
            </Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        customMapStyle={mapDarkStyle}
      >
        {users.map((user) => {
          const anim = getMarkerAnim(user.userId);
          return (
            <Marker
              key={user.userId}
              coordinate={{ latitude: user.latitude, longitude: user.longitude }}
              onPress={() => openSheet(user)}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <Animated.View
                style={[
                  styles.markerWrap,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                    opacity: anim,
                    transform: [
                      { scale: anim },
                    ],
                  },
                ]}
              >
                {user.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={[styles.markerAvatar, { borderColor: colors.surface }]}
                  />
                ) : (
                  <View style={[styles.markerPlaceholder, { backgroundColor: colors.borderLight, borderColor: colors.surface }]}>
                    <Text style={[styles.markerLetter, { color: colors.textSecondary }]}>
                      {(user.name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </Animated.View>
            </Marker>
          );
        })}
      </MapView>

      {/* Bottom sheet */}
      <Modal
        visible={!!selectedUser}
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
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          {selectedUser && (
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
                {selectedUser.avatarUrl ? (
                  <Image
                    source={{ uri: selectedUser.avatarUrl }}
                    style={[styles.sheetAvatar, { borderColor: colors.borderLight }]}
                  />
                ) : (
                  <View style={[styles.sheetAvatarPlaceholder, { backgroundColor: colors.borderLight }]}>
                    <Text style={[styles.sheetAvatarLetter, { color: colors.textSecondary }]}>
                      {(selectedUser.name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={[styles.sheetName, { color: colors.text }]} numberOfLines={1}>
                  {selectedUser.name || 'Unknown'}
                </Text>
              </View>
              {profileLoading ? (
                <Text style={[styles.sheetBio, { color: colors.textSecondary }]}>Loading…</Text>
              ) : profile?.bio?.trim() ? (
                <Text style={[styles.sheetBio, { color: colors.textSecondary }]} numberOfLines={3}>
                  {profile.bio.trim()}
                </Text>
              ) : null}
              <View style={styles.sheetActions}>
                <Pressable
                  style={[styles.sheetButton, styles.sheetButtonPrimary, { backgroundColor: colors.accent }]}
                  onPress={() => { closeSheet(); onConnect(selectedUser.userId); }}
                >
                  <Ionicons name="person-add-outline" size={20} color="#0A0A0B" />
                  <Text style={[styles.sheetButtonTextPrimary, { color: '#0A0A0B' }]}>Connect</Text>
                </Pressable>
                <Pressable
                  style={[styles.sheetButton, styles.sheetButtonSecondary, { borderColor: colors.borderLight }]}
                  onPress={() => { closeSheet(); onViewProfile(selectedUser.userId); }}
                >
                  <Ionicons name="person-outline" size={20} color={colors.text} />
                  <Text style={[styles.sheetButtonText, { color: colors.text }]}>View Profile</Text>
                </Pressable>
              </View>
            </View>
            </Animated.View>
          )}
        </Animated.View>
      </Modal>
    </View>
  );
}

const mapDarkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#71717a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#27272a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#3f3f46' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f12' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#141416' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  deniedWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.screenPadding,
  },
  deniedTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  deniedText: { fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  markerWrap: {
    alignItems: 'center',
    borderWidth: 2.5,
    borderRadius: MARKER_SIZE / 2 + 10,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  markerAvatar: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 1,
    borderColor: '#fff',
  },
  markerPlaceholder: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  markerLetter: { fontSize: 18, fontWeight: '700' },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Layout.radiusXl,
    borderTopRightRadius: Layout.radiusXl,
    borderWidth: 1,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetContent: { paddingHorizontal: Layout.screenPadding, paddingBottom: Layout.screenPadding },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sheetAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1 },
  sheetAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetAvatarLetter: { fontSize: 22, fontWeight: '700' },
  sheetName: { fontSize: 20, fontWeight: '700', marginLeft: 14, flex: 1 },
  sheetBio: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  sheetActions: { gap: 10 },
  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Layout.radiusMd,
  },
  sheetButtonPrimary: {},
  sheetButtonSecondary: { borderWidth: 1 },
  sheetButtonText: { fontSize: 16, fontWeight: '600' },
  sheetButtonTextPrimary: { fontSize: 16, fontWeight: '600' },
});
