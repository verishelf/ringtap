/**
 * Event details page - full info for a map event
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { HeaderBackButton } from '@/components/HeaderBackButton';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProAvatar } from '@/components/ProBadge';
import { Layout } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { MapEvent } from '@/lib/api';
import { deleteMapEvent, getMapEvent, getProfile, getSubscription } from '@/lib/api';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { user } = useSession();
  const { isPro } = useSubscription();
  const [event, setEvent] = useState<MapEvent | null>(null);
  const [organizerName, setOrganizerName] = useState<string>('');
  const [organizerAvatar, setOrganizerAvatar] = useState<string | null>(null);
  const [organizerPro, setOrganizerPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }
    let cancelled = false;
    getMapEvent(id)
      .then(async (e) => {
        if (cancelled || !e) return;
        setEvent(e);
        try {
          const [profile, sub] = await Promise.all([getProfile(e.userId), getSubscription(e.userId)]);
          if (!cancelled) {
            setOrganizerName(profile?.name?.trim() ?? '');
            setOrganizerAvatar(profile?.avatarUrl?.trim() ?? null);
            setOrganizerPro((sub?.plan as string) === 'pro');
          }
        } catch {
          if (!cancelled) setOrganizerName('');
        }
      })
      .catch(() => setEvent(null))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const handleDelete = useCallback(() => {
    if (!event || event.userId !== user?.id) return;
    Alert.alert(
      'Delete event',
      `Delete "${event.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteMapEvent(user!.id, event.id);
            if (result.success) router.back();
            else Alert.alert('Error', result.error ?? 'Could not delete');
          },
        },
      ]
    );
  }, [event, user?.id, router]);

  const handleOpenMaps = useCallback(() => {
    if (!event) return;
    const url = Platform.select({
      ios: `maps://app?daddr=${event.latitude},${event.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`,
    });
    Linking.openURL(url);
  }, [event]);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Image source={require('@/assets/images/loading.gif')} style={{ width: 64, height: 64 }} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Event not found</Text>
        <HeaderBackButton tintColor={colors.text} canGoBack />
      </View>
    );
  }

  const isOwner = event.userId === user?.id;
  const region = {
    latitude: event.latitude,
    longitude: event.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <HeaderBackButton tintColor={colors.text} canGoBack />
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Event
        </Text>
        {isOwner ? (
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}
            hitSlop={12}
          >
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Layout.tabBarHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mapWrap, { borderRadius: Layout.radiusLg, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight }]}>
          <MapView
            style={styles.map}
            region={region}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <Marker
              coordinate={{ latitude: event.latitude, longitude: event.longitude }}
              title={event.name}
            />
          </MapView>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={styles.cardIconWrap}>
            <Ionicons name="calendar" size={28} color={colors.accent} />
          </View>
          <Text style={[styles.eventName, { color: colors.text }]}>{event.name}</Text>
          <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
            {new Date(event.eventDate).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {event.description ? (
            <Text style={[styles.eventDesc, { color: colors.textSecondary }]}>{event.description}</Text>
          ) : null}
        </View>

        <Pressable
          style={[styles.directionsBtn, { backgroundColor: colors.accent }]}
          onPress={handleOpenMaps}
        >
          <Ionicons name="navigate" size={20} color="#0A0A0B" />
          <Text style={styles.directionsBtnText}>Get directions</Text>
        </Pressable>

        <View style={[styles.organizerSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.organizerLabel, { color: colors.textSecondary }]}>Organizer</Text>
          <Pressable
            style={[styles.organizerRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() => router.push(`/profile/${event.userId}` as const)}
          >
            <ProAvatar
              avatarUrl={organizerAvatar}
              size="medium"
              isPro={organizerPro}
              placeholderLetter={organizerName.charAt(0) || '?'}
            />
            <View style={styles.organizerInfo}>
              <Text style={[styles.organizerName, { color: colors.text }]}>{organizerName || 'Unknown'}</Text>
              <Text style={[styles.viewProfile, { color: colors.accent }]}>View profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, marginBottom: 16 },
  backBtn: { width: 40, padding: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center' },
  deleteBtn: { width: 40, padding: 4, alignItems: 'flex-end' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Layout.screenPadding, paddingTop: 20 },
  mapWrap: { height: 180, marginBottom: 20 },
  map: { flex: 1, width: '100%', height: '100%' },
  card: {
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    padding: Layout.cardPadding,
    marginBottom: 20,
  },
  cardIconWrap: { marginBottom: 12 },
  eventName: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  eventDate: { fontSize: 15, marginBottom: 12 },
  eventDesc: { fontSize: 15, lineHeight: 22 },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
    marginBottom: 24,
  },
  directionsBtnText: { fontSize: 16, fontWeight: '600', color: '#0A0A0B' },
  organizerSection: {
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  organizerLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 10 },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  organizerInfo: { flex: 1, marginLeft: 14 },
  organizerName: { fontSize: 16, fontWeight: '600' },
  viewProfile: { fontSize: 14, marginTop: 2 },
});
