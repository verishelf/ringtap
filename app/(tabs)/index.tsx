import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { useSession } from '@/hooks/useSession';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getAnalytics, getScannedContacts } from '@/lib/api';
import type { ScannedContact } from '@/lib/supabase/types';

dayjs.extend(relativeTime);

const RING_SIZE = 140;
const RING_STROKE = 3;
const INNER_CIRCLE = 64;
const STORE_URL = 'https://www.ringtap.me/store';

export default function HomeScreen() {
  const { user } = useSession();
  const { profile } = useProfile();
  const colors = useThemeColors();
  const [scannedCards, setScannedCards] = useState<ScannedContact[]>([]);
  const [tapsThisWeek, setTapsThisWeek] = useState(0);
  const [viewsThisWeek, setViewsThisWeek] = useState(0);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const glowAnim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowAnim]);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      setLoadingDashboard(false);
      return;
    }
    setLoadingDashboard(true);
    try {
      const [contacts, analytics] = await Promise.all([
        getScannedContacts(user.id).then((list) => list.slice(0, 5)),
        profile?.id ? getAnalytics(profile.id, 7) : Promise.resolve({ nfcTaps: 0, qrScans: 0, profileViews: 0 }),
      ]);
      setScannedCards(contacts);
      if (analytics && 'nfcTaps' in analytics) {
        setTapsThisWeek(analytics.nfcTaps + analytics.qrScans);
        setViewsThisWeek(analytics.profileViews);
      }
    } catch (_) {
      setScannedCards([]);
    } finally {
      setLoadingDashboard(false);
    }
  }, [user?.id, profile?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hi{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your RingTap card</Text>
          </View>
          <Link href="/(tabs)/profile" asChild>
            <Pressable style={[styles.profileIconWrap, { backgroundColor: colors.surface }]}>
              <Ionicons name="person-circle-outline" size={36} color={colors.accent} />
            </Pressable>
          </Link>
        </View>

        {/* Tap to share — glowing rings */}
        <Link href="/share/nfc" asChild>
          <Pressable style={styles.scanRingWrap}>
            <View style={[styles.scanRingContainer, { width: RING_SIZE, height: RING_SIZE }]}>
              <Animated.View
                style={[
                  styles.scanRingOuter,
                  {
                    width: RING_SIZE,
                    height: RING_SIZE,
                    borderRadius: RING_SIZE / 2,
                    borderColor: colors.borderLight,
                    opacity: glowAnim.interpolate({ inputRange: [0.5, 1], outputRange: [0.6, 1] }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.scanRingMid,
                  {
                    width: RING_SIZE - 24,
                    height: RING_SIZE - 24,
                    borderRadius: (RING_SIZE - 24) / 2,
                    borderColor: colors.accent,
                    left: 12,
                    top: 12,
                    opacity: glowAnim,
                  },
                ]}
              />
              <View style={[styles.scanRingInner, { width: INNER_CIRCLE, height: INNER_CIRCLE, borderRadius: INNER_CIRCLE / 2, backgroundColor: colors.surface, left: (RING_SIZE - INNER_CIRCLE) / 2, top: (RING_SIZE - INNER_CIRCLE) / 2 }]}>
                <Ionicons name="phone-portrait-outline" size={28} color={colors.accent} />
              </View>
            </View>
            <Text style={[styles.scanRingLabel, { color: colors.text }]}>Tap to share</Text>
            <Text style={[styles.scanRingHint, { color: colors.textSecondary }]}>NFC or QR — your card, one tap</Text>
          </Pressable>
        </Link>

        {/* Dashboard */}
        <View style={styles.dashboard}>
          {/* This week — mini stats */}
          <View style={[styles.statsCard, { backgroundColor: colors.surface + 'F5', borderColor: colors.borderLight }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>This week</Text>
            {loadingDashboard ? (
              <ActivityIndicator size="small" color={colors.accent} style={styles.dashLoader} />
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{tapsThisWeek}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taps</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{viewsThisWeek}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Views</Text>
                </View>
              </View>
            )}
          </View>

          {/* Recently scanned cards */}
          <View style={[styles.recentCard, { backgroundColor: colors.surface + 'F5', borderColor: colors.borderLight }]}>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recently scanned cards</Text>
              <Link href="/(tabs)/profile" asChild>
                <Pressable>
                  <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
                </Pressable>
              </Link>
            </View>
            {loadingDashboard ? (
              <ActivityIndicator size="small" color={colors.accent} style={styles.dashLoader} />
            ) : scannedCards.length === 0 ? (
              <Text style={[styles.recentEmpty, { color: colors.textSecondary }]}>
                No scanned cards yet. When someone saves your card, they’ll appear here.
              </Text>
            ) : (
              scannedCards.map((contact) => (
                <View key={contact.id} style={[styles.recentRow, { borderBottomColor: colors.borderLight }]}>
                  <View style={[styles.recentAvatar, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.recentAvatarText, { color: colors.accent }]} numberOfLines={1}>
                      {(contact.name || contact.email || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={[styles.recentName, { color: colors.text }]} numberOfLines={1}>
                      {contact.name?.trim() || contact.email?.trim() || 'Unknown'}
                    </Text>
                    <Text style={[styles.recentTime, { color: colors.textSecondary }]}>
                      {dayjs(contact.createdAt).fromNow()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Store card */}
          <Pressable
            style={[styles.storeCard, { backgroundColor: colors.surface + 'F5', borderColor: colors.borderLight }]}
            onPress={() => Linking.openURL(STORE_URL)}
          >
            <View style={[styles.storeIconWrap, { backgroundColor: colors.accent + '33' }]}>
              <Ionicons name="bag-outline" size={28} color={colors.accent} />
            </View>
            <View style={styles.storeTextWrap}>
              <Text style={[styles.storeTitle, { color: colors.text }]}>RingTap Store</Text>
              <Text style={[styles.storeSubtitle, { color: colors.textSecondary }]}>
                NFC rings, cards & accessories — ringtap.me/store
              </Text>
            </View>
            <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Layout.screenPadding, paddingBottom: Layout.screenPaddingBottom },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.sectionGap,
  },
  headerLeft: { flex: 1, minWidth: 0 },
  greeting: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: Layout.body, marginTop: 4 },
  profileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  scanRingWrap: {
    alignItems: 'center',
    marginBottom: Layout.sectionGap,
    paddingVertical: Layout.cardPadding,
  },
  dashboard: { gap: Layout.sectionGap },
  statsCard: {
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    padding: Layout.cardPadding,
  },
  sectionTitle: {
    fontSize: Layout.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Layout.tightGap,
  },
  dashLoader: { paddingVertical: Layout.rowGap },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: Layout.caption, marginTop: 2 },
  statDivider: { width: 1, height: 28 },
  recentCard: {
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    padding: Layout.cardPadding,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.tightGap,
  },
  seeAll: { fontSize: Layout.caption, fontWeight: '600' },
  recentEmpty: { fontSize: Layout.bodySmall, fontStyle: 'italic', paddingVertical: 8 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  recentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentAvatarText: { fontSize: 15, fontWeight: '700' },
  recentInfo: { flex: 1, minWidth: 0 },
  recentName: { fontSize: Layout.bodySmall, fontWeight: '600' },
  recentTime: { fontSize: Layout.caption, marginTop: 2 },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    padding: Layout.cardPadding,
    gap: 14,
  },
  storeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeTextWrap: { flex: 1, minWidth: 0 },
  storeTitle: { fontSize: Layout.titleSection, fontWeight: '600' },
  storeSubtitle: { fontSize: Layout.caption, marginTop: 2 },
  scanRingContainer: {
    position: 'relative',
  },
  scanRingOuter: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderWidth: RING_STROKE,
  },
  scanRingMid: {
    position: 'absolute',
    borderWidth: RING_STROKE,
  },
  scanRingInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanRingLabel: { fontSize: Layout.titleSection + 1, fontWeight: '700', marginTop: 14 },
  scanRingHint: { fontSize: Layout.caption, marginTop: 4 },
});
