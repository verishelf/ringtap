import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Layout } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  type Appointment,
  fetchAppointments,
  formatAppointment,
  subscribeToRealtimeAppointments,
  syncAppointmentsFromCalendly,
} from '@/lib/calendly/appointments';
import { isCalendlyConnected } from '@/lib/calendly/calendlyAuth';

function groupByDate(appointments: Appointment[]): { date: string; items: Appointment[] }[] {
  const groups: Record<string, Appointment[]> = {};
  for (const a of appointments) {
    const d = new Date(a.startTime).toDateString();
    if (!groups[d]) groups[d] = [];
    groups[d].push(a);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, items]) => ({ date, items: items.sort((x, y) => new Date(x.startTime).getTime() - new Date(y.startTime).getTime()) }));
}

export default function MyAppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    isCalendlyConnected(user.id).then(setConnected);
  }, [user?.id]);

  const load = useCallback(async (syncFirst = false) => {
    if (!user?.id) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (syncFirst) await syncAppointmentsFromCalendly();
    const list = await fetchAppointments(user.id);
    setAppointments(list);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = subscribeToRealtimeAppointments(user.id, setAppointments, {
      syncOnFirstLoad: true,
    });
    return unsub;
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        load();
        isCalendlyConnected(user.id).then(setConnected);
      }
    }, [user, load])
  );

  const onRefresh = useCallback(() => {
    if (user?.id) {
      load(true);
      isCalendlyConnected(user.id).then(setConnected);
    }
  }, [user?.id, load]);

  const groups = groupByDate(appointments);
  const futureGroups = groups.filter((g) => new Date(g.date) >= new Date(new Date().setHours(0, 0, 0, 0)));
  const displayGroups = futureGroups.length > 0 ? futureGroups : groups.slice(0, 5);

  const renderItem: ListRenderItem<{ date: string; items: Appointment[] }> = ({ item }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {new Date(item.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </Text>
      {item.items.map((appt) => {
        const { dateLabel, timeRange, title, statusLabel } = formatAppointment(appt);
        return (
          <View
            key={appt.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
                opacity: appt.status === 'canceled' ? 0.6 : 1,
              },
            ]}
          >
            <View style={styles.cardRow}>
              <View style={[styles.timeBadge, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.timeText, { color: colors.text }]}>{timeRange}</Text>
              </View>
              {appt.status === 'canceled' && (
                <Text style={[styles.statusBadge, { color: colors.destructive }]}>{statusLabel}</Text>
              )}
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            {appt.inviteeEmail ? (
              <Text style={[styles.cardEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                {appt.inviteeEmail}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );

  if (loading && appointments.length === 0) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + Layout.sectionGap }]}>
      <FlatList
        data={displayGroups}
        keyExtractor={(item) => item.date}
        renderItem={renderItem}
        onRefresh={onRefresh}
        refreshing={loading}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No upcoming appointments
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {connected
                ? 'Bookings will appear here when someone schedules with you'
                : 'Connect Calendly to sync your schedule'}
            </Text>
            {!connected && (
              <Pressable
                style={[styles.connectBtn, { backgroundColor: colors.accent }]}
                onPress={() => router.push('/calendly/connect')}
              >
                <Text style={[styles.connectBtnText, { color: colors.primary }]}>Connect Calendly</Text>
              </Pressable>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Layout.screenPadding, paddingBottom: Layout.sectionGap },
  section: { marginBottom: Layout.sectionGap },
  sectionTitle: { fontSize: Layout.bodySmall, fontWeight: '600', marginBottom: Layout.rowGap },
  card: {
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    marginBottom: Layout.rowGap,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  timeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Layout.radiusSm },
  timeText: { fontSize: Layout.caption, fontWeight: '600' },
  statusBadge: { fontSize: Layout.caption, fontWeight: '600' },
  cardTitle: { fontSize: Layout.body, fontWeight: '600' },
  cardEmail: { fontSize: Layout.caption, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: Layout.sectionGap * 2 },
  emptyText: { fontSize: Layout.body, fontWeight: '600', marginTop: Layout.rowGap },
  emptySubtext: { fontSize: Layout.caption, marginTop: 4 },
  connectBtn: {
    marginTop: Layout.sectionGap,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Layout.radiusMd,
  },
  connectBtnText: { fontSize: Layout.body, fontWeight: '600' },
});
