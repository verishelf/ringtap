/**
 * Networking Map screen (Pro). Shows nearby RingTap users on a map.
 * Requests location permission, polls location every 60s, queries nearby users within 10km.
 */

import { NetworkingMap } from '@/components/NetworkingMap';
import { Layout } from '@/constants/theme';
import { useNearbyUsers } from '@/hooks/useNearbyUsers';
import { useProfile } from '@/hooks/useProfile';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import { saveContact } from '@/lib/api';
import {
    getCurrentCoordinates,
    getLocationPermissionStatus,
    requestLocationPermission,
    startLocationPolling,
} from '@/services/locationService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useSession();
  const { profile } = useProfile();
  const { isPro } = useSubscription();
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const stopPollingRef = useRef<(() => void) | null>(null);

  const {
    users,
    loading: nearbyLoading,
    refetch: refetchNearby,
  } = useNearbyUsers({
    centerLat: currentLocation?.latitude ?? null,
    centerLon: currentLocation?.longitude ?? null,
    enabled: !!currentLocation && !!user?.id && isPro,
    excludeUserId: user?.id ?? null,
  });

  const initLocation = useCallback(async () => {
    if (!user?.id || !isPro) {
      setLocationLoading(false);
      return;
    }
    setLocationLoading(true);
    setPermissionDenied(false);
    const status = await getLocationPermissionStatus();
    if (status === 'denied') {
      setPermissionDenied(true);
      setCurrentLocation(null);
      setLocationLoading(false);
      return;
    }
    if (status !== 'granted') {
      const requested = await requestLocationPermission();
      if (requested !== 'granted') {
        setPermissionDenied(true);
        setCurrentLocation(null);
        setLocationLoading(false);
        return;
      }
    }
    const coords = await getCurrentCoordinates();
    setCurrentLocation(coords);
    setLocationLoading(false);
  }, [user?.id, isPro]);

  useEffect(() => {
    initLocation();
  }, [initLocation]);

  useEffect(() => {
    if (!isPro || !user?.id || !profile || !currentLocation) return;
    stopPollingRef.current = startLocationPolling(
      {
        userId: user.id,
        name: profile.name?.trim() ?? '',
        avatarUrl: profile.avatarUrl ?? null,
      },
      () => {}
    );
    return () => {
      stopPollingRef.current?.();
      stopPollingRef.current = null;
    };
  }, [isPro, user?.id, profile?.name, profile?.avatarUrl, currentLocation]);

  const handleConnect = useCallback(
    async (userId: string) => {
      if (!user?.id) return;
      const profileToSave = await import('@/lib/api').then((api) => api.getProfile(userId));
      const result = await saveContact(
        userId,
        profileToSave?.name ?? '',
        profileToSave?.avatarUrl ?? undefined
      );
      if (result.success) {
        Alert.alert('Contact saved', 'You can message them from Contacts.');
      } else {
        Alert.alert('Could not save', result.error ?? 'Try again.');
      }
    },
    [user?.id]
  );

  const handleViewProfile = useCallback(
    (userId: string) => {
      router.push(`/profile/${userId}` as const);
    },
    [router]
  );

  if (!isPro) {
    return (
      <View style={[styles.proGate, { paddingTop: insets.top + Layout.screenPadding, backgroundColor: colors.background }]}>
        <View style={[styles.proGateIconWrap, { backgroundColor: colors.surface }]}>
          <Ionicons name="map-outline" size={40} color={colors.accent} />
        </View>
        <Text style={[styles.proGateTitle, { color: colors.text }]}>Networking Map</Text>
        <Text style={[styles.proGateText, { color: colors.textSecondary }]}>
          See RingTap users nearby and connect in person. Upgrade to Pro to unlock.
        </Text>
        <Pressable
          style={[styles.proGateButton, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/(tabs)/settings/upgrade')}
        >
          <Text style={[styles.proGateButtonText, { color: '#0A0A0B' }]}>Upgrade to Pro</Text>
        </Pressable>
      </View>
    );
  }

  const loading = locationLoading || (!!currentLocation && nearbyLoading && users.length === 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            paddingBottom: 12,
            paddingHorizontal: Layout.screenPadding,
            backgroundColor: colors.background,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <Text style={[styles.counter, { color: colors.text }]}>
          {users.length === 0 && !loading
            ? 'No RingTap users nearby'
            : `${users.length} RingTap user${users.length !== 1 ? 's' : ''} nearby`}
        </Text>
      </View>
      <View style={styles.mapWrap}>
        <NetworkingMap
          currentUserId={user?.id ?? null}
          currentLocation={currentLocation}
          users={users}
          loading={loading}
          onConnect={handleConnect}
          onViewProfile={handleViewProfile}
          locationPermissionDenied={permissionDenied}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  counter: { fontSize: 15, fontWeight: '600' },
  mapWrap: { flex: 1 },
  proGate: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.screenPadding,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proGateIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  proGateTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  proGateText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  proGateButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Layout.radiusMd,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  proGateButtonText: { fontSize: 16, fontWeight: '600' },
});
