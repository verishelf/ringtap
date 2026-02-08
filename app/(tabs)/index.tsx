import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Link, useFocusEffect } from 'expo-router';
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

import { ProAvatar, NameWithVerified } from '@/components/ProBadge';
import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getAnalytics, getConversations, getProfile, getSavedContacts, getScannedContacts, getSubscription } from '@/lib/api';
import type { SavedContact } from '@/lib/api';
import type { ConversationWithPeer } from '@/lib/api';
import type { ScannedContact } from '@/lib/supabase/types';

dayjs.extend(relativeTime);

const RING_SIZE = 140;
const RING_STROKE = 3;
const INNER_CIRCLE = 64;
const STORE_URL = 'https://www.ringtap.me/store';
const PRO_RING_COLOR = '#D4AF37';

type RecentContact = { type: 'scanned'; data: ScannedContact } | { type: 'saved'; data: SavedContact };

export default function HomeScreen() {
  const { user } = useSession();
  const { profile } = useProfile();
  const { isPro } = useSubscription();
  const colors = useThemeColors();
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([]);
  const [recentMessages, setRecentMessages] = useState<ConversationWithPeer[]>([]);
  const [recentAvatarByUserId, setRecentAvatarByUserId] = useState<Record<string, string | null>>({});
  const [recentIsProByUserId, setRecentIsProByUserId] = useState<Record<string, boolean>>({});
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
      const [scanned, saved, conversations, analytics] = await Promise.all([
        getScannedContacts(user.id),
        getSavedContacts(),
        getConversations(user.id),
        profile?.id ? getAnalytics(profile.id, 7) : Promise.resolve({ nfcTaps: 0, qrScans: 0, profileViews: 0 }),
      ]);
      setRecentMessages((conversations ?? []).slice(0, 5));
      const merged: RecentContact[] = [
        ...scanned.map((c) => ({ type: 'scanned' as const, data: c })),
        ...saved.map((c) => ({ type: 'saved' as const, data: c })),
      ].sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime());
      const list = merged.slice(0, 10);
      setRecentContacts(list);
      const userIds = [...new Set(list.map((item) => (item.type === 'saved' ? (item.data as SavedContact).contactUserId : (item.data as ScannedContact).userId)))];
      const avatarMap: Record<string, string | null> = {};
      const proMap: Record<string, boolean> = {};
      await Promise.all(
        userIds.map(async (uid) => {
          try {
            const [p, sub] = await Promise.all([getProfile(uid), getSubscription(uid)]);
            avatarMap[uid] = p?.avatarUrl?.trim() ?? null;
            proMap[uid] = (sub?.plan as string) === 'pro';
          } catch {
            avatarMap[uid] = null;
            proMap[uid] = false;
          }
        })
      );
      setRecentAvatarByUserId(avatarMap);
      setRecentIsProByUserId(proMap);
      if (analytics && 'nfcTaps' in analytics) {
        setTapsThisWeek(analytics.nfcTaps + analytics.qrScans);
        setViewsThisWeek(analytics.profileViews);
      }
    } catch (_) {
      setRecentContacts([]);
      setRecentMessages([]);
      setRecentAvatarByUserId({});
      setRecentIsProByUserId({});
    } finally {
      setLoadingDashboard(false);
    }
  }, [user?.id, profile?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

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
          <View style={[styles.profileCircleWrap, isPro && styles.profileCircleWrapPro]}>
            {isPro ? (
              <View style={styles.profileGoldRing} pointerEvents="none" />
            ) : null}
            <Link href="/(tabs)/profile" asChild>
              <Pressable style={[styles.profileIconWrap, { backgroundColor: colors.surface }]}>
                {profile?.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={styles.profileAvatar} />
                ) : (
                  <Ionicons name="person-circle-outline" size={36} color={colors.accent} />
                )}
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Tap to share — glowing rings */}
        <Link href="/share/qr" asChild>
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

          {/* Recent messages */}
          <View style={[styles.recentCard, { backgroundColor: colors.surface + 'F5', borderColor: colors.borderLight }]}>
            <View style={styles.recentHeader}>
              <View style={styles.recentHeaderTitleRow}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recent messages</Text>
                {recentMessages.some((c) => c.hasUnread) ? (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.unreadBadgeText, { color: colors.primary }]}>New</Text>
                  </View>
                ) : null}
              </View>
              <Link href="/messages" asChild>
                <Pressable>
                  <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
                </Pressable>
              </Link>
            </View>
            {loadingDashboard ? (
              <ActivityIndicator size="small" color={colors.accent} style={styles.dashLoader} />
            ) : recentMessages.length === 0 ? (
              <Text style={[styles.recentEmpty, { color: colors.textSecondary }]}>
                No messages yet. Message a saved contact to start.
              </Text>
            ) : (
              recentMessages.map((conv) => (
                <Link key={conv.id} href={`/messages/${conv.id}` as const} asChild>
                  <Pressable style={[styles.recentRow, { borderBottomColor: colors.borderLight }]}>
                    <ProAvatar
                      avatarUrl={conv.peerAvatarUrl}
                      isPro={conv.peerIsPro}
                      size="small"
                      placeholderLetter={conv.peerName || '?'}
                      style={styles.recentAvatarWrap}
                    />
                    <View style={styles.recentInfo}>
                      <NameWithVerified
                        name={`${conv.peerName || 'Unknown'}${conv.hasUnread ? ' · New' : ''}`}
                        isPro={conv.peerIsPro}
                      />
                      <Text style={[styles.recentTime, { color: colors.textSecondary }]} numberOfLines={1}>
                        {conv.lastMessageBody || 'No messages yet'}
                        {conv.lastMessageAt ? ` · ${dayjs(conv.lastMessageAt).fromNow()}` : ''}
                      </Text>
                    </View>
                    {conv.hasUnread ? (
                      <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
                    ) : null}
                  </Pressable>
                </Link>
              ))
            )}
          </View>

          {/* Recently scanned cards */}
          <View style={[styles.recentCard, { backgroundColor: colors.surface + 'F5', borderColor: colors.borderLight }]}>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recent contacts</Text>
              <Link href="/(tabs)/contacts" asChild>
                <Pressable>
                  <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
                </Pressable>
              </Link>
            </View>
            {loadingDashboard ? (
              <ActivityIndicator size="small" color={colors.accent} style={styles.dashLoader} />
            ) : recentContacts.length === 0 ? (
              <Text style={[styles.recentEmpty, { color: colors.textSecondary }]}>
                No scanned or saved contacts yet. Save a profile in the app or scan a card to see them here.
              </Text>
            ) : (
              recentContacts.map((item) => {
                const isSaved = item.type === 'saved';
                const id = item.data.id;
                const contactUserId = isSaved ? (item.data as SavedContact).contactUserId : (item.data as ScannedContact).userId;
                const name = isSaved
                  ? (item.data.displayName || 'Saved contact').trim()
                  : (item.data.name?.trim() || item.data.email?.trim() || 'Unknown');
                const createdAt = item.data.createdAt;
                const storedAvatar = (isSaved ? (item.data as SavedContact).avatarUrl : (item.data as ScannedContact).avatarUrl)?.trim() || null;
                const avatarUrl = recentAvatarByUserId[contactUserId] ?? storedAvatar ?? null;
                const isPro = recentIsProByUserId[contactUserId] ?? false;
                const row = (
                  <View style={[styles.recentRow, { borderBottomColor: colors.borderLight }]}>
                    <ProAvatar
                      avatarUrl={avatarUrl}
                      isPro={isPro}
                      size="small"
                      placeholderLetter={name}
                      style={styles.recentAvatarWrap}
                    />
                    <View style={styles.recentInfo}>
                      <NameWithVerified name={name} isPro={isPro} />
                      <Text style={[styles.recentTime, { color: colors.textSecondary }]}>
                        {dayjs(createdAt).fromNow()}
                        {isSaved ? ' · Saved' : ''}
                      </Text>
                    </View>
                  </View>
                );
                return isSaved ? (
                  <Link key={`saved-${id}`} href={`/profile/${contactUserId}` as const} asChild>
                    <Pressable>{row}</Pressable>
                  </Link>
                ) : (
                  <View key={`scanned-${id}`}>{row}</View>
                );
              })
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
  profileCircleWrap: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCircleWrapPro: {
    width: 50,
    height: 50,
  },
  profileGoldRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: PRO_RING_COLOR,
  },
  profileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatar: { width: 44, height: 44, borderRadius: 22 },
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
  recentHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
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
  },
  recentAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  recentAvatarWrap: { marginRight: 12 },
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
