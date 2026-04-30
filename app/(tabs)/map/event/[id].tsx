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
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
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
import {
  deleteMapEvent,
  getEventAttendees,
  getMapEvent,
  getMyEventAttending,
  getProfile,
  getSavedContacts,
  getSubscription,
  setEventAttending,
} from '@/lib/api';
import type { SavedContact } from '@/lib/api';

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
  const [attendees, setAttendees] = useState<{ userId: string; avatarUrl: string | null; name: string }[]>([]);
  const [myAttending, setMyAttending] = useState<boolean | null>(null);
  const [attendingLoading, setAttendingLoading] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteContacts, setInviteContacts] = useState<SavedContact[]>([]);

  const fetchAttendees = useCallback(async (eventId: string) => {
    const [list, mine] = await Promise.all([
      getEventAttendees(eventId),
      getMyEventAttending(eventId),
    ]);
    setAttendees(list);
    setMyAttending(mine);
  }, []);

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
        fetchAttendees(e.id).catch(() => {});
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
  }, [id, router, fetchAttendees]);

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

  const eventShareUrl = `https://www.ringtap.me/e/${event?.id ?? ''}`;
  const eventShareMessage = event
    ? `${event.name} – ${new Date(event.eventDate).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}. Join me: ${eventShareUrl}`
    : '';

  const handleShare = useCallback(async () => {
    if (!event) return;
    try {
      await Share.share({
        message: eventShareMessage,
        url: eventShareUrl,
        title: event.name,
      });
    } catch {
      // User cancelled
    }
  }, [event, eventShareMessage, eventShareUrl]);

  const handleOpenInviteModal = useCallback(async () => {
    const list = await getSavedContacts();
    setInviteContacts(list);
    setInviteModalVisible(true);
  }, []);

  const handleInviteContact = useCallback(
    async (contact: SavedContact) => {
      const name = contact.displayName?.trim() || 'there';
      const message = `Hey ${name}! Join me at ${event?.name ?? 'this event'} – ${eventShareUrl}`;
      try {
        await Share.share({
          message,
          url: eventShareUrl,
          title: `Invite to ${event?.name ?? 'event'}`,
        });
      } catch {
        // User cancelled
      }
    },
    [event?.name, eventShareUrl]
  );

  const handleAttending = useCallback(
    async (attending: boolean) => {
      if (!user?.id || !event || attendingLoading) return;
      setAttendingLoading(true);
      const result = await setEventAttending(user.id, event.id, attending);
      if (result.success) {
        setMyAttending(attending);
        const list = await getEventAttendees(event.id);
        setAttendees(list);
      }
      setAttendingLoading(false);
    },
    [user?.id, event, attendingLoading]
  );

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
        {event.imageUrl ? (
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.eventImage}
            contentFit="cover"
          />
        ) : null}
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

          {user && (
            <>
              <Text style={[styles.attendingLabel, { color: colors.textSecondary }]}>Are you attending?</Text>
              <View style={styles.attendingButtons}>
                <Pressable
                  style={[
                    styles.attendingBtn,
                    { backgroundColor: colors.surface, borderColor: colors.borderLight },
                    myAttending === true && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                  onPress={() => handleAttending(true)}
                  disabled={attendingLoading}
                >
                  <Text
                    style={[
                      styles.attendingBtnText,
                      { color: myAttending === true ? colors.onAccent : colors.text },
                    ]}
                  >
                    Yes
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.attendingBtn,
                    { backgroundColor: colors.surface, borderColor: colors.borderLight },
                    myAttending === false && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                  onPress={() => handleAttending(false)}
                  disabled={attendingLoading}
                >
                  <Text
                    style={[
                      styles.attendingBtnText,
                      { color: myAttending === false ? colors.onAccent : colors.text },
                    ]}
                  >
                    No
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {attendees.length > 0 && (
            <View style={styles.attendeesRow}>
              <View style={styles.attendeesAvatars}>
                {attendees.slice(0, 6).map((a, i) => (
                  <Pressable
                    key={a.userId}
                    style={[
                      styles.attendeeAvatarWrap,
                      { marginLeft: i === 0 ? 0 : -10, borderColor: colors.surface },
                    ]}
                    onPress={() => router.push(`/profile/${a.userId}` as const)}
                  >
                    <ProAvatar
                      avatarUrl={a.avatarUrl}
                      size="small"
                      isPro={false}
                      placeholderLetter={a.name.charAt(0) || '?'}
                    />
                  </Pressable>
                ))}
                {attendees.length > 6 && (
                  <View style={[styles.attendeeMore, { marginLeft: -10, backgroundColor: colors.borderLight }]}>
                    <Text style={[styles.attendeeMoreText, { color: colors.textSecondary }]}>
                      +{attendees.length - 6} more
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <Pressable
          style={[styles.directionsBtn, { backgroundColor: colors.accent }]}
          onPress={handleOpenMaps}
        >
          <Ionicons name="navigate" size={20} color={colors.onAccent} />
          <Text style={[styles.directionsBtnText, { color: colors.onAccent }]}>Get directions</Text>
        </Pressable>

        <View style={styles.shareActions}>
          <Pressable
            style={[styles.shareBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color={colors.accent} />
            <Text style={[styles.shareBtnText, { color: colors.accent }]}>Share</Text>
          </Pressable>
          <Pressable
            style={[styles.shareBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={handleOpenInviteModal}
          >
            <Ionicons name="people-outline" size={20} color={colors.accent} />
            <Text style={[styles.shareBtnText, { color: colors.accent }]}>Invite contacts</Text>
          </Pressable>
        </View>

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

      <Modal visible={inviteModalVisible} transparent animationType="slide">
        <Pressable style={styles.inviteOverlay} onPress={() => setInviteModalVisible(false)}>
          <Pressable
            style={[styles.inviteModal, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.inviteHeader, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.inviteTitle, { color: colors.text }]}>Invite contacts</Text>
              <Pressable onPress={() => setInviteModalVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            {inviteContacts.length === 0 ? (
              <View style={styles.inviteEmpty}>
                <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.inviteEmptyText, { color: colors.textSecondary }]}>
                  No saved contacts. Add contacts from profiles first.
                </Text>
              </View>
            ) : (
              <FlatList
                data={inviteContacts}
                keyExtractor={(c) => c.id}
                style={styles.inviteList}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.inviteRow,
                      { backgroundColor: colors.background, opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => handleInviteContact(item)}
                  >
                    <ProAvatar
                      avatarUrl={item.avatarUrl}
                      size="small"
                      isPro={false}
                      placeholderLetter={item.displayName?.charAt(0) || '?'}
                    />
                    <Text style={[styles.inviteRowName, { color: colors.text }]} numberOfLines={1}>
                      {item.displayName?.trim() || 'Unknown'}
                    </Text>
                    <Ionicons name="send-outline" size={20} color={colors.accent} />
                  </Pressable>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  eventImage: { width: '100%', height: 200, borderRadius: Layout.radiusLg, marginBottom: 20 },
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
  directionsBtnText: { fontSize: 16, fontWeight: '600' },
  shareActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  shareBtnText: { fontSize: 15, fontWeight: '600' },
  inviteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  inviteModal: {
    borderTopLeftRadius: Layout.radiusXl,
    borderTopRightRadius: Layout.radiusXl,
    maxHeight: '70%',
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.screenPadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inviteTitle: { fontSize: 18, fontWeight: '700' },
  inviteEmpty: { padding: 32, alignItems: 'center', gap: 12 },
  inviteEmptyText: { fontSize: 15, textAlign: 'center' },
  inviteList: { maxHeight: 300, padding: Layout.screenPadding },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Layout.radiusMd,
    marginBottom: 8,
    gap: 12,
  },
  inviteRowName: { flex: 1, fontSize: 16 },
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
  attendingLabel: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  attendingButtons: { flexDirection: 'row', gap: 12 },
  attendingBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  attendingBtnText: { fontSize: 15, fontWeight: '600' },
  attendeesRow: { marginTop: 16 },
  attendeesAvatars: { flexDirection: 'row', alignItems: 'center' },
  attendeeAvatarWrap: { borderWidth: 2, borderColor: 'transparent', borderRadius: 20 },
  attendeeMore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendeeMoreText: { fontSize: 11, fontWeight: '600' },
});
