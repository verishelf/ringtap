/**
 * Networking Map screen (Pro). Shows nearby RingTap users on a map.
 * Requests location permission, polls location every 60s, queries nearby users within 10km.
 */

import { AddEventModal } from '@/components/AddEventModal';
import { EventsMapView } from '@/components/EventsMapView';
import { HotspotsMapView } from '@/components/HotspotsMapView';
import { NetworkingMap } from '@/components/NetworkingMap';
import { Layout } from '@/constants/theme';
import { useLocation } from '@/contexts/LocationContext';
import { useNearbyEvents } from '@/hooks/useNearbyEvents';
import { useNearbyUsers } from '@/hooks/useNearbyUsers';
import { useProfile } from '@/hooks/useProfile';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import { deleteMapEvent, getSavedContacts, saveContact, type MapEvent } from '@/lib/api';
import {
  getCurrentCoordinates,
  getLocationPermissionStatus,
  requestLocationPermission,
  startLocationPolling,
} from '@/services/locationService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  const { locationEnabled } = useLocation();
  const [activeTab, setActiveTab] = useState<'users' | 'hotspots' | 'events'>('users');
  const stopPollingRef = useRef<(() => void) | null>(null);

  const {
    users,
    loading: nearbyLoading,
    refetch: refetchNearby,
  } = useNearbyUsers({
    centerLat: currentLocation?.latitude ?? null,
    centerLon: currentLocation?.longitude ?? null,
    enabled: !!currentLocation && !!user?.id && isPro && locationEnabled && (activeTab === 'users' || activeTab === 'hotspots'),
    excludeUserId: user?.id ?? null,
  });

  const [addEventVisible, setAddEventVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MapEvent | null>(null);
  const [savedContactUserIds, setSavedContactUserIds] = useState<Set<string>>(new Set());
  const {
    events,
    loading: eventsLoading,
    refetch: refetchEvents,
  } = useNearbyEvents({
    centerLat: currentLocation?.latitude ?? null,
    centerLon: currentLocation?.longitude ?? null,
    enabled: !!currentLocation && isPro && activeTab === 'events' && locationEnabled,
  });

  const initLocation = useCallback(async () => {
    if (!user?.id || !isPro || !locationEnabled) {
      setLocationLoading(false);
      if (!locationEnabled) setCurrentLocation(null);
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
  }, [user?.id, isPro, locationEnabled]);

  useEffect(() => {
    initLocation();
  }, [initLocation]);

  useEffect(() => {
    if (!isPro || !user?.id || !profile || !currentLocation || !locationEnabled) return;
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

  useFocusEffect(
    useCallback(() => {
      if (!user?.id || !isPro) return;
      getSavedContacts().then((contacts) => {
        setSavedContactUserIds(new Set(contacts.map((c) => c.contactUserId)));
      });
    }, [user?.id, isPro])
  );

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
        setSavedContactUserIds((prev) => new Set([...prev, userId]));
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

  const handleDeleteEvent = useCallback(
    async (event: MapEvent) => {
      if (event.userId !== user?.id) return;
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
              if (result.success) refetchEvents();
              else Alert.alert('Error', result.error ?? 'Could not delete');
            },
          },
        ]
      );
    },
    [user?.id, refetchEvents]
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <View style={styles.mapWrap}>
            <NetworkingMap
              currentUserId={user?.id ?? null}
              currentLocation={currentLocation}
              users={users}
              loading={loading}
              savedContactUserIds={savedContactUserIds}
              onConnect={handleConnect}
              onViewProfile={handleViewProfile}
              locationPermissionDenied={permissionDenied}
              locationEnabled={locationEnabled}
            />
          </View>
        );
      case 'hotspots':
        return (
          <View style={styles.mapWrap}>
            <HotspotsMapView
              currentLocation={currentLocation}
              users={users}
              loading={loading}
              savedContactUserIds={savedContactUserIds}
              onConnect={handleConnect}
              onViewProfile={handleViewProfile}
              locationPermissionDenied={permissionDenied}
              locationEnabled={locationEnabled}
            />
          </View>
        );
      case 'events':
        return (
          <View style={styles.eventsWrap}>
            <View style={styles.eventsMapSection}>
              <EventsMapView currentLocation={currentLocation} events={events} />
            </View>
            <View style={[styles.eventsListSection, { backgroundColor: colors.background }]}>
              <View style={[styles.eventsListHeader, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.eventsListTitle, { color: colors.text }]}>Events nearby</Text>
                {isPro && (
                  <TouchableOpacity
                    style={[styles.addEventBtn, { backgroundColor: colors.accent }]}
                    onPress={() => {
                  setEditingEvent(null);
                  setAddEventVisible(true);
                }}
                  >
                    <Ionicons name="add" size={20} color="#0A0A0B" />
                    <Text style={[styles.addEventBtnText, { color: '#0A0A0B' }]}>Add event</Text>
                  </TouchableOpacity>
                )}
              </View>
              {eventsLoading && events.length === 0 ? (
                <View style={styles.eventsListEmpty}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[styles.eventsListEmptyText, { color: colors.textSecondary }]}>Loading events…</Text>
                </View>
              ) : events.length === 0 ? (
                <View style={styles.eventsListEmpty}>
                  <Ionicons name="calendar-outline" size={40} color={colors.textSecondary} />
                  <Text style={[styles.eventsListEmptyText, { color: colors.textSecondary }]}>
                    {!locationEnabled
                      ? 'Turn on Location to see events nearby.'
                      : `No events nearby. ${isPro ? 'Add one!' : ''}`}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={events}
                  keyExtractor={(e) => e.id}
                  contentContainerStyle={styles.eventsListContent}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                      onPress={() => router.push(`/(tabs)/map/event/${item.id}` as const)}
                    >
                      <View style={styles.eventCardIcon}>
                        <Ionicons name="calendar" size={18} color={colors.accent} />
                      </View>
                      <View style={styles.eventCardBody}>
                        <Text style={[styles.eventCardName, { color: colors.text }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.description ? (
                          <Text style={[styles.eventCardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                            {item.description}
                          </Text>
                        ) : null}
                        <Text style={[styles.eventCardDate, { color: colors.textSecondary }]}>
                          {new Date(item.eventDate).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        {item.userId === user?.id && (
                          <View style={styles.eventCardActions}>
                            <TouchableOpacity
                              style={[styles.eventCardActionBtn, { borderColor: colors.borderLight }]}
                              onPress={() => {
                                setEditingEvent(item);
                                setAddEventVisible(true);
                              }}
                            >
                              <Ionicons name="pencil-outline" size={16} color={colors.accent} />
                              <Text style={[styles.eventCardActionText, { color: colors.accent }]}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.eventCardActionBtn, { borderColor: colors.borderLight }]}
                              onPress={() => handleDeleteEvent(item)}
                            >
                              <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                              <Text style={[styles.eventCardActionText, { color: colors.destructive }]}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  )}
                />
              )}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const tabs: { key: typeof activeTab; label: string; shortLabel: string; icon: string }[] = [
    { key: 'users', label: 'Nearby Users', shortLabel: 'Nearby', icon: 'people' },
    { key: 'hotspots', label: 'Networking Hotspots', shortLabel: 'Hotspots', icon: 'location' },
    { key: 'events', label: 'Events Nearby', shortLabel: 'Events', icon: 'calendar' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Bar - Segmented control style */}
      <View
        style={[
          styles.tabBar,
          {
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            backgroundColor: colors.background,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <View style={[styles.tabSegmented, { backgroundColor: colors.surface }]}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabSegment,
                  isActive && { backgroundColor: colors.accent },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={isActive ? '#0A0A0B' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabSegmentText,
                    { color: isActive ? '#0A0A0B' : colors.textSecondary },
                  ]}
                >
                  {tab.shortLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      <AddEventModal
        visible={addEventVisible}
        userId={user?.id ?? ''}
        currentLocation={currentLocation}
        editingEvent={editingEvent}
        onClose={() => {
          setAddEventVisible(false);
          setEditingEvent(null);
        }}
        onCreated={() => {
          refetchEvents();
          setEditingEvent(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    paddingHorizontal: Layout.screenPadding,
  },
  tabSegmented: {
    flexDirection: 'row',
    borderRadius: Layout.radiusMd,
    padding: 4,
  },
  tabSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Layout.radiusSm,
    gap: 6,
  },
  tabSegmentText: { fontSize: 14, fontWeight: '600' },
  mapWrap: { flex: 1 },
  eventsWrap: { flex: 1, flexDirection: 'column' },
  eventsMapSection: { height: 200 },
  eventsListSection: { flex: 1, minHeight: 0 },
  eventsListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  eventsListTitle: { fontSize: 17, fontWeight: '600' },
  addEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Layout.radiusMd,
  },
  addEventBtnText: { fontSize: 14, fontWeight: '600' },
  eventsListContent: { padding: Layout.screenPadding, paddingBottom: 40 },
  eventsListEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.screenPadding,
  },
  eventsListEmptyText: { fontSize: 15, marginTop: 12, textAlign: 'center' },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    marginBottom: Layout.rowGap,
  },
  eventCardIcon: { marginRight: 12 },
  eventCardBody: { flex: 1, minWidth: 0 },
  eventCardName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  eventCardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  eventCardDate: { fontSize: 13 },
  eventCardActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  eventCardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Layout.radiusSm,
    borderWidth: 1,
  },
  eventCardActionText: { fontSize: 13, fontWeight: '500' },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
  placeholderTitle: { fontSize: 20, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  placeholderText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  header: {},
  counter: { fontSize: 15, fontWeight: '600' },
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
