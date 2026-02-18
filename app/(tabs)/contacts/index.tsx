import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  FlatList,
  ListRenderItem,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProAvatar, NameWithVerified } from '@/components/ProBadge';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSession } from '@/hooks/useSession';
import {
  getSavedContacts,
  getProfile,
  getSubscription,
  deleteSavedContact,
} from '@/lib/api';
import type { SavedContact } from '@/lib/api';
import {
  type Appointment,
  fetchAppointments,
  formatAppointment,
  subscribeToRealtimeAppointments,
} from '@/lib/calendly/appointments';
import { isCalendlyConnected } from '@/lib/calendly/calendlyAuth';

type TabId = 'messages' | 'calendly';

function groupByDate(appointments: Appointment[]): { date: string; items: Appointment[] }[] {
  const groups: Record<string, Appointment[]> = {};
  for (const a of appointments) {
    const d = new Date(a.startTime).toDateString();
    if (!groups[d]) groups[d] = [];
    groups[d].push(a);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, items]) => ({
      date,
      items: items.sort(
        (x, y) => new Date(x.startTime).getTime() - new Date(y.startTime).getTime()
      ),
    }));
}

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>('messages');

  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarByUserId, setAvatarByUserId] = useState<Record<string, string | null>>({});
  const [isProByUserId, setIsProByUserId] = useState<Record<string, boolean>>({});

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [calendlyConnected, setCalendlyConnected] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getSavedContacts();
      setContacts(list ?? []);
      setAvatarByUserId({});
      setIsProByUserId({});
      if (list?.length) {
        const avatarMap: Record<string, string | null> = {};
        const proMap: Record<string, boolean> = {};
        await Promise.all(
          list.map(async (c) => {
            const url = c.avatarUrl?.trim();
            if (url) avatarMap[c.contactUserId] = url;
            else {
              try {
                const profile = await getProfile(c.contactUserId);
                avatarMap[c.contactUserId] = profile?.avatarUrl?.trim() ?? null;
              } catch {
                avatarMap[c.contactUserId] = null;
              }
            }
            try {
              const sub = await getSubscription(c.contactUserId);
              proMap[c.contactUserId] = (sub?.plan as string) === 'pro';
            } catch {
              proMap[c.contactUserId] = false;
            }
          })
        );
        setAvatarByUserId((prev) => ({ ...prev, ...avatarMap }));
        setIsProByUserId((prev) => ({ ...prev, ...proMap }));
      }
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadCalendly = useCallback(async () => {
    if (!user?.id) return;
    const connected = await isCalendlyConnected(user.id);
    setCalendlyConnected(connected);
    if (connected) {
      const list = await fetchAppointments(user.id);
      setAppointments(list);
    } else {
      setAppointments([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = subscribeToRealtimeAppointments(user.id, setAppointments);
    return unsub;
  }, [user?.id]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadContacts();
        loadCalendly();
      }
    }, [user, loadContacts, loadCalendly])
  );

  useEffect(() => {
    if (activeTab === 'calendly' && user) loadCalendly();
  }, [activeTab, user, loadCalendly]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && user) loadCalendly();
    });
    return () => sub.remove();
  }, [user, loadCalendly]);

  const handleDelete = useCallback((contact: SavedContact) => {
    Alert.alert(
      'Remove contact',
      `Remove ${contact.displayName || 'this contact'} from your list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteSavedContact(contact.id);
            if (ok) setContacts((prev) => prev.filter((c) => c.id !== contact.id));
          },
        },
      ]
    );
  }, []);

  const renderContactItem: ListRenderItem<SavedContact> = useCallback(
    ({ item }) => {
      const avatarUrl =
        item.avatarUrl?.trim() || avatarByUserId[item.contactUserId] || null;
      const isPro = isProByUserId[item.contactUserId] ?? false;
      const name = item.displayName || 'Saved contact';
      return (
        <Pressable
          style={[
            styles.row,
            { backgroundColor: colors.surface, borderColor: colors.borderLight },
          ]}
          onPress={() => router.push(`/profile/${item.contactUserId}` as const)}
        >
          <ProAvatar
            avatarUrl={avatarUrl}
            isPro={isPro}
            size="medium"
            placeholderLetter={name}
            style={styles.avatarWrap}
          />
          <NameWithVerified
            name={name}
            isPro={isPro}
            containerStyle={styles.nameWrap}
          />
          <Pressable
            onPress={() => handleDelete(item)}
            hitSlop={12}
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons
              name="trash-outline"
              size={ROW_ICON_SIZE}
              color={colors.textSecondary}
            />
          </Pressable>
        </Pressable>
      );
    },
    [colors, avatarByUserId, isProByUserId, handleDelete, router]
  );

  const groups = groupByDate(appointments);
  const futureGroups = groups.filter(
    (g) => new Date(g.date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );
  const displayGroups = futureGroups.length > 0 ? futureGroups : groups.slice(0, 5);

  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Sign in to see your saved contacts.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom },
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <Pressable
          style={[
            styles.tab,
            activeTab === 'messages' && {
              backgroundColor: colors.accent,
              borderColor: colors.accent,
            },
          ]}
          onPress={() => setActiveTab('messages')}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={18}
            color={activeTab === 'messages' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'messages' ? colors.primary : colors.textSecondary,
                fontWeight: activeTab === 'messages' ? '600' : '500',
              },
            ]}
          >
            Messages
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'calendly' && {
              backgroundColor: colors.accent,
              borderColor: colors.accent,
            },
          ]}
          onPress={() => setActiveTab('calendly')}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={activeTab === 'calendly' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'calendly' ? colors.primary : colors.textSecondary,
                fontWeight: activeTab === 'calendly' ? '600' : '500',
              },
            ]}
          >
            Calendly
          </Text>
        </Pressable>
      </View>

      {activeTab === 'messages' && (
        <>
          {loading ? (
            <View style={styles.centered}>
              <Image
                source={require('@/assets/images/loading.gif')}
                style={{ width: 64, height: 64 }}
              />
            </View>
          ) : (
            <>
              <Pressable
                style={[
                  styles.messagesRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                  },
                ]}
                onPress={() => router.push('/messages')}
              >
                <View
                  style={[
                    styles.messagesIconWrap,
                    { backgroundColor: colors.accent + '33' },
                  ]}
                >
                  <Ionicons
                    name="chatbubbles-outline"
                    size={ROW_ICON_SIZE + 4}
                    color={colors.accent}
                  />
                </View>
                <Text style={[styles.messagesLabel, { color: colors.text }]}>
                  Messages
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={ROW_CHEVRON_SIZE}
                  color={colors.textSecondary}
                />
              </Pressable>
              <FlatList
                data={contacts}
                keyExtractor={(item) => item.id}
                renderItem={renderContactItem}
                contentContainerStyle={[
                  styles.listContent,
                  contacts.length === 0 && styles.listEmpty,
                ]}
                ListEmptyComponent={
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    No saved contacts yet. Open a profile and tap "Save Contact"
                    to add one.
                  </Text>
                }
              />
            </>
          )}
        </>
      )}

      {activeTab === 'calendly' && (
        <ScrollView
          style={styles.calendlyScroll}
          contentContainerStyle={[
            styles.calendlyContent,
            displayGroups.length === 0 && !calendlyConnected && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {!calendlyConnected ? (
            <View style={styles.calendlyEmpty}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.emptyText, { color: colors.textSecondary }]}
              >
                Connect Calendly to sync your schedule
              </Text>
              <Pressable
                style={[styles.connectBtn, { backgroundColor: colors.accent }]}
                onPress={() => router.push('/calendly/connect')}
              >
                <Text
                  style={[styles.connectBtnText, { color: colors.primary }]}
                >
                  Connect Calendly
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Pressable
                style={[
                  styles.calendlyActionRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                  },
                ]}
                onPress={() => router.push('/calendly/appointments')}
              >
                <Ionicons
                  name="calendar-outline"
                  size={ROW_ICON_SIZE + 4}
                  color={colors.accent}
                />
                <Text style={[styles.messagesLabel, { color: colors.text }]}>
                  My Appointments
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={ROW_CHEVRON_SIZE}
                  color={colors.textSecondary}
                />
              </Pressable>
              <Pressable
                style={[
                  styles.calendlyActionRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                  },
                ]}
                onPress={() => router.push('/calendly/links')}
              >
                <Ionicons
                  name="link-outline"
                  size={ROW_ICON_SIZE + 4}
                  color={colors.accent}
                />
                <Text style={[styles.messagesLabel, { color: colors.text }]}>
                  Booking Links
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={ROW_CHEVRON_SIZE}
                  color={colors.textSecondary}
                />
              </Pressable>
              {displayGroups.length === 0 ? (
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  No upcoming appointments
                </Text>
              ) : (
                displayGroups.map((g) => (
                  <View key={g.date} style={styles.section}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {new Date(g.date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                    {g.items.map((appt) => {
                      const {
                        timeRange,
                        title,
                        statusLabel,
                      } = formatAppointment(appt);
                      return (
                        <View
                          key={appt.id}
                          style={[
                            styles.apptCard,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.borderLight,
                              opacity: appt.status === 'canceled' ? 0.6 : 1,
                            },
                          ]}
                        >
                          <View style={styles.cardRow}>
                            <View
                              style={[
                                styles.timeBadge,
                                {
                                  backgroundColor: colors.surfaceElevated,
                                },
                              ]}
                            >
                              <Text
                                style={[styles.timeText, { color: colors.text }]}
                              >
                                {timeRange}
                              </Text>
                            </View>
                            {appt.status === 'canceled' && (
                              <Text
                                style={[
                                  styles.statusBadge,
                                  { color: colors.destructive },
                                ]}
                              >
                                {statusLabel}
                              </Text>
                            )}
                          </View>
                          <Text
                            style={[styles.cardTitle, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {title}
                          </Text>
                          {appt.inviteeEmail ? (
                            <Text
                              style={[
                                styles.cardEmail,
                                { color: colors.textSecondary },
                              ]}
                              numberOfLines={1}
                            >
                              {appt.inviteeEmail}
                            </Text>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const ROW_ICON_SIZE = 22;
const ROW_CHEVRON_SIZE = 20;

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.cardPadding,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Layout.screenPadding,
    marginTop: Layout.screenPadding,
    marginBottom: 8,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabLabel: { fontSize: 15 },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 40,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  messagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Layout.screenPadding,
    marginHorizontal: Layout.screenPadding,
    marginBottom: 8,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  messagesIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messagesLabel: { flex: 1, fontSize: 17, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 8,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  avatarWrap: { marginRight: 12 },
  nameWrap: { flex: 1 },
  deleteBtn: { padding: 8 },
  emptyText: { textAlign: 'center', fontSize: 15 },
  calendlyScroll: { flex: 1 },
  calendlyContent: {
    padding: Layout.screenPadding,
    paddingBottom: 40,
  },
  calendlyEmpty: {
    alignItems: 'center',
    paddingVertical: Layout.sectionGap * 2,
  },
  calendlyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 8,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  connectBtn: {
    marginTop: Layout.sectionGap,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Layout.radiusMd,
  },
  connectBtnText: { fontSize: Layout.body, fontWeight: '600' },
  section: { marginBottom: Layout.sectionGap },
  sectionTitle: {
    fontSize: Layout.bodySmall,
    fontWeight: '600',
    marginBottom: Layout.rowGap,
  },
  apptCard: {
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    marginBottom: Layout.rowGap,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Layout.radiusSm,
  },
  timeText: { fontSize: Layout.caption, fontWeight: '600' },
  statusBadge: { fontSize: Layout.caption, fontWeight: '600' },
  cardTitle: { fontSize: Layout.body, fontWeight: '600' },
  cardEmail: { fontSize: Layout.caption, marginTop: 2 },
});
