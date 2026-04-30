/**
 * Networking Map screen (Pro). Shows nearby RingTap users on a map.
 * Requests location permission, polls location every 60s, queries nearby users within 10km.
 */

import { AddEventModal } from '@/components/AddEventModal';
import { EventsMapView } from '@/components/EventsMapView';
import { HotspotsMapView } from '@/components/HotspotsMapView';
import { NetworkingMap } from '@/components/NetworkingMap';
import { ProGateAnimatedContent } from '@/components/ProGateAnimatedContent';
import { ProGateFeatureList } from '@/components/ProGateFeatureList';
import { Layout } from '@/constants/theme';
import { useLocation } from '@/contexts/LocationContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNearbyEvents } from '@/hooks/useNearbyEvents';
import { useNearbyUsers } from '@/hooks/useNearbyUsers';
import { usePresentRevenueCatPaywall } from '@/hooks/usePresentRevenueCatPaywall';
import { useProfile } from '@/hooks/useProfile';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import { deleteMapEvent, getEventAttendeeCounts, getSavedContacts, saveContact, type MapEvent } from '@/lib/api';
import {
    getCurrentCoordinates,
    getLocationPermissionStatus,
    requestLocationPermission,
    startLocationPolling,
} from '@/services/locationService';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    ImageBackground,
    LayoutAnimation,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useSession();
  const { profile } = useProfile();
  const { isPro } = useSubscription();
  const { presentPaywall, presentingPaywall } = usePresentRevenueCatPaywall();
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const { locationEnabled } = useLocation();
  const [activeTab, setActiveTab] = useState<'users' | 'hotspots' | 'events'>('users');
  const [eventsMapExpanded, setEventsMapExpanded] = useState(false);
  const stopPollingRef = useRef<(() => void) | null>(null);
  const { height: screenHeight } = Dimensions.get('window');

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
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (events.length === 0) {
      setAttendeeCounts({});
      return;
    }
    getEventAttendeeCounts(events.map((e) => e.id))
      .then(setAttendeeCounts)
      .catch(() => setAttendeeCounts({}));
  }, [events]);

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
        profileToSave?.avatarUrl ?? undefined,
        undefined
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
    const proGateOverlay =
      colorScheme === 'light' ? 'rgba(250, 250, 250, 0.78)' : 'rgba(10, 10, 11, 0.78)';
    return (
      <ImageBackground
        source={require('@/assets/images/map-pro-gate-bg.png')}
        style={[styles.proGate, { paddingTop: insets.top }]}
        imageStyle={styles.proGateBgImage}
      >
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: proGateOverlay }]}
          pointerEvents="none"
        />
        <ScrollView
          style={styles.proGateScroll}
          contentContainerStyle={[
            styles.proGateScrollContent,
            {
              paddingBottom: insets.bottom + Layout.tabBarHeight + Layout.rowGap,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ProGateAnimatedContent style={styles.proGateStack}>
            <View style={styles.proGateHeader}>
              <View style={[styles.proGateIconWrap, { backgroundColor: colors.surface }]}>
                <Ionicons name="map-outline" size={40} color={colors.accent} />
              </View>
              <Text style={[styles.proGateTitle, { color: colors.text }]}>Networking Map</Text>
              <Text style={[styles.proGateText, { color: colors.textSecondary }]}>
                See who is nearby, browse hotspots and events, and connect in person — plus every other Pro benefit below.
              </Text>
            </View>
            <ProGateFeatureList />
            <Pressable
              style={[styles.proGateButton, { backgroundColor: colors.accent }, presentingPaywall && { opacity: 0.7 }]}
              onPress={() => void presentPaywall()}
              disabled={presentingPaywall}
            >
              <Text style={[styles.proGateButtonText, { color: colors.onAccent }]}>Upgrade to Pro</Text>
            </Pressable>
          </ProGateAnimatedContent>
        </ScrollView>
      </ImageBackground>
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
      case 'events': {
        const mapHeight = eventsMapExpanded ? Math.min(screenHeight * 0.6, 400) : 200;
        const toggleMap = () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setEventsMapExpanded((v) => !v);
        };
        return (
          <View style={styles.eventsWrap}>
            <View style={[styles.eventsMapSection, { height: mapHeight }]}>
              <EventsMapView currentLocation={currentLocation} events={events} />
              <TouchableOpacity
                style={[styles.expandMapBtn, { backgroundColor: colors.surface }]}
                onPress={toggleMap}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={eventsMapExpanded ? 'contract-outline' : 'expand-outline'}
                  size={22}
                  color={colors.text}
                />
              </TouchableOpacity>
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
                    <Ionicons name="add" size={20} color={colors.onAccent} />
                    <Text style={[styles.addEventBtnText, { color: colors.onAccent }]}>Add event</Text>
                  </TouchableOpacity>
                )}
              </View>
              {eventsLoading && events.length === 0 ? (
                <View style={styles.eventsListEmpty}>
                  <Image source={require('@/assets/images/loading.gif')} style={{ width: 32, height: 32 }} />
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
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.eventCardImage} contentFit="cover" />
                      ) : (
                        <View style={[styles.eventCardIconWrap, { backgroundColor: colors.background }]}>
                          <Ionicons name="calendar" size={24} color={colors.accent} />
                        </View>
                      )}
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
                        {(attendeeCounts[item.id] ?? 0) > 0 && (
                          <Text style={[styles.eventCardGoing, { color: colors.accent }]}>
                            {attendeeCounts[item.id]} {attendeeCounts[item.id] === 1 ? 'person' : 'people'} going
                          </Text>
                        )}
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
      }
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
                  color={isActive ? colors.onAccent : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabSegmentText,
                    { color: isActive ? colors.onAccent : colors.textSecondary },
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
  eventsMapSection: { position: 'relative', overflow: 'hidden' },
  expandMapBtn: {
    position: 'absolute',
    bottom: 12,
    right: Layout.screenPadding,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
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
    overflow: 'hidden',
    alignItems: 'flex-start',
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    marginBottom: Layout.rowGap,
  },
  eventCardIcon: { marginRight: 12 },
  eventCardImage: { width: 72, height: 72, borderRadius: Layout.radiusMd, marginRight: 12 },
  eventCardIconWrap: { width: 72, height: 72, borderRadius: Layout.radiusMd, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  eventCardBody: { flex: 1, minWidth: 0 },
  eventCardName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  eventCardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  eventCardDate: { fontSize: 13 },
  eventCardGoing: { fontSize: 13, fontWeight: '600', marginTop: 4 },
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
  },
  proGateBgImage: {
    resizeMode: 'cover',
  },
  proGateScroll: { flex: 1 },
  proGateScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.sectionGap,
  },
  proGateStack: {
    width: '100%',
    alignItems: 'stretch',
  },
  proGateHeader: { width: '100%', alignItems: 'center' },
  proGateIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  proGateTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  proGateText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  proGateButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Layout.radiusMd,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  proGateButtonText: { fontSize: 16, fontWeight: '600' },
});
