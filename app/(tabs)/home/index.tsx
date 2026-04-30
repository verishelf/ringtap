import { BadgeEarnedModal } from '@/components/BadgeEarnedModal';
import { LinkableText } from '@/components/LinkableText';
import { NameWithVerified, ProAvatar } from '@/components/ProBadge';
import { Layout } from '@/constants/theme';
import { useLocation } from '@/contexts/LocationContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBadges } from '@/hooks/useBadges';
import { useNearbyUsers } from '@/hooks/useNearbyUsers';
import { useProfile } from '@/hooks/useProfile';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ConversationWithPeer, SavedContact } from '@/lib/api';
import { getAnalytics, getConversations, getProfile, getSavedContacts, getScannedContactDisplayName, getScannedContacts, getSubscription } from '@/lib/api';
import type { ScannedContact } from '@/lib/supabase/types';
import { getCurrentCoordinates } from '@/services/locationService';
import type { Post } from '@/services/postService';
import { getPosts } from '@/services/postService';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

dayjs.extend(relativeTime);

const RING_SIZE = 140;
const RING_STROKE = 3;
const INNER_CIRCLE = 64;
const STORE_URL = 'https://www.ringtap.me/store';
const PRO_RING_COLOR = '#D4AF37';

type RecentContact = { type: 'scanned'; data: ScannedContact } | { type: 'saved'; data: SavedContact };

// Subtle gradient colors (dark: deep with hints of blue/purple; light: soft pastel)
const GRADIENT_DARK = ['#0A0A0B', '#0d0f18', '#0f0a14', '#0a0c14', '#0A0A0B'] as const;
const GRADIENT_LIGHT = ['#FAFAFA', '#f5f7ff', '#faf5ff', '#f5f8fa', '#FAFAFA'] as const;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSession();
  const { profile } = useProfile();
  const { isPro } = useSubscription();
  const { locationEnabled } = useLocation();
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const gradientColors = (colorScheme === 'light' ? GRADIENT_LIGHT : GRADIENT_DARK) as unknown as readonly [string, string, ...string[]];
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([]);
  const [recentMessages, setRecentMessages] = useState<ConversationWithPeer[]>([]);
  const [recentAvatarByUserId, setRecentAvatarByUserId] = useState<Record<string, string | null>>({});
  const [recentNameByUserId, setRecentNameByUserId] = useState<Record<string, string>>({});
  const [recentIsProByUserId, setRecentIsProByUserId] = useState<Record<string, boolean>>({});
  const [tapsThisWeek, setTapsThisWeek] = useState(0);
  const [viewsThisWeek, setViewsThisWeek] = useState(0);
  const [displayTaps, setDisplayTaps] = useState(0);
  const [displayViews, setDisplayViews] = useState(0);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [opportunityPosts, setOpportunityPosts] = useState<Post[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const { newlyEarnedBadges, dismissNewBadgeModal } = useBadges();

  const { users: nearbyUsers } = useNearbyUsers({
    centerLat: currentLocation?.latitude ?? null,
    centerLon: currentLocation?.longitude ?? null,
    enabled: !!user?.id && isPro && locationEnabled,
    excludeUserId: user?.id ?? null,
  });

  useEffect(() => {
    if (!user?.id || !isPro || !locationEnabled) return;
    getCurrentCoordinates().then(setCurrentLocation);
  }, [user?.id, isPro, locationEnabled]);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      setLoadingDashboard(false);
      return;
    }
    setLoadingDashboard(true);
    try {
      // Resolve profile id so we load analytics even when useProfile hasn't populated yet
      const profileId = profile?.id ?? (await getProfile(user.id))?.id ?? null;
      const [scanned, saved, conversations, analytics, posts] = await Promise.all([
        getScannedContacts(user.id),
        getSavedContacts(),
        getConversations(user.id),
        profileId
          ? getAnalytics(profileId, 7)
          : Promise.resolve({ profileViews: 0, linkClicks: 0, nfcTaps: 0, qrScans: 0 }),
        getPosts(20),
      ]);
      setRecentMessages((conversations ?? []).slice(0, 5));
      const isPlaceholder = (c: ScannedContact) =>
        (c.name?.toLowerCase() === 'john smith' && c.email?.toLowerCase() === 'john.smith@acme.com') ||
        (c.company?.toLowerCase() === 'acme corp' && c.email?.toLowerCase() === 'john.smith@acme.com');
      const merged: RecentContact[] = [
        ...scanned.filter((c) => !isPlaceholder(c)).map((c) => ({ type: 'scanned' as const, data: c })),
        ...saved.map((c) => ({ type: 'saved' as const, data: c })),
      ].sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime());
      const list = merged.slice(0, 10);
      setRecentContacts(list);
      const userIds = [...new Set(list.filter((item) => item.type === 'saved').map((item) => (item.data as SavedContact).contactUserId))];
      const avatarMap: Record<string, string | null> = {};
      const nameMap: Record<string, string> = {};
      const proMap: Record<string, boolean> = {};
      await Promise.all(
        userIds.map(async (uid) => {
          try {
            const [p, sub] = await Promise.all([getProfile(uid), getSubscription(uid)]);
            avatarMap[uid] = p?.avatarUrl?.trim() ?? null;
            if (p?.name?.trim()) nameMap[uid] = p.name.trim();
            proMap[uid] = (sub?.plan as string) === 'pro';
          } catch {
            avatarMap[uid] = null;
            proMap[uid] = false;
          }
        })
      );
      setRecentAvatarByUserId(avatarMap);
      setRecentNameByUserId(nameMap);
      setRecentIsProByUserId(proMap);
      setOpportunityPosts((posts ?? []).filter((p) => p.userId !== user?.id));
      if (analytics && 'nfcTaps' in analytics) {
        setTapsThisWeek(analytics.nfcTaps + analytics.qrScans);
        setViewsThisWeek(analytics.profileViews);
      }
    } catch (_) {
      setRecentContacts([]);
      setRecentMessages([]);
      setRecentAvatarByUserId({});
      setRecentNameByUserId({});
      setOpportunityPosts([]);
      setTapsThisWeek(0);
      setViewsThisWeek(0);
    } finally {
      setLoadingDashboard(false);
    }
  }, [user?.id, profile?.id]);

  // Animate stat numbers when they change
  useEffect(() => {
    let frame: number;
    const duration = 500;

    // Always animate from 0 up to the latest values
    const startTaps = 0;
    const endTaps = tapsThisWeek;
    const startViews = 0;
    const endViews = viewsThisWeek;
    const startTime = Date.now();
    let lastTicks = 0;
    const TICK_INTERVAL_MS = 80; // Throttle haptic ticks during animation

    const step = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      const taps = Math.round(startTaps + (endTaps - startTaps) * ease);
      const views = Math.round(startViews + (endViews - startViews) * ease);
      setDisplayTaps(taps);
      setDisplayViews(views);

      // Throttled haptic during animation
      if (progress < 1 && (endTaps > 0 || endViews > 0)) {
        const elapsed = now - startTime;
        const ticks = Math.floor(elapsed / TICK_INTERVAL_MS);
        if (ticks > lastTicks) {
          lastTicks = ticks;
          Haptics.selectionAsync();
        }
      }

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else if (endTaps > 0 || endViews > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };

    frame = requestAnimationFrame(step);
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [tapsThisWeek, viewsThisWeek]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  return (
    <View style={styles.container}>
        <BadgeEarnedModal
          visible={newlyEarnedBadges.length > 0}
          badge={newlyEarnedBadges[0] ?? null}
          onDismiss={dismissNewBadgeModal}
        />
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Layout.screenPadding, paddingBottom: insets.bottom + Layout.tabBarHeight + Layout.sectionGap }]} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hi{profile?.name?.trim() ? `, ${profile.name.trim().split(/\s+/)[0]}` : ''}
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

        {/* Nearby users banner — opens Map when tapped */}
        {isPro && locationEnabled && (
          <Pressable
            style={[styles.nearbyBanner, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() => router.push('/(tabs)/map')}
          >
            <Ionicons name="people" size={24} color={colors.accent} />
            <Text style={[styles.nearbyBannerText, { color: colors.text }]}>
              👋 {nearbyUsers.length} RingTap user{nearbyUsers.length !== 1 ? 's' : ''} nearby — tap to view map
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        )}

        {/* Tap to share — static colorful rings (no animation to avoid crashes) */}
        <Link href="/share/qr" asChild>
          <Pressable style={[styles.scanRingWrap, styles.scanRingGlowShadow, { backgroundColor: colors.surface + '18' }]}>
            <View style={[styles.scanRingContainer, { width: RING_SIZE, height: RING_SIZE }]}>
              {/* Outer ring — cyan */}
              <View
                style={[
                  styles.scanRingOuter,
                  {
                    width: RING_SIZE,
                    height: RING_SIZE,
                    borderRadius: RING_SIZE / 2,
                    borderColor: '#00D4FF',
                    opacity: 0.8,
                    borderWidth: 4,
                  },
                ]}
              />
              {/* Mid ring — accent */}
              <View
                style={[
                  styles.scanRingMid,
                  {
                    width: RING_SIZE - 20,
                    height: RING_SIZE - 20,
                    borderRadius: (RING_SIZE - 20) / 2,
                    borderColor: colors.accent,
                    left: 10,
                    top: 10,
                    opacity: 0.9,
                    borderWidth: 3,
                  },
                ]}
              />
              {/* Inner ring — magenta */}
              <View
                style={[
                  styles.scanRingOuter,
                  {
                    width: RING_SIZE - 40,
                    height: RING_SIZE - 40,
                    borderRadius: (RING_SIZE - 40) / 2,
                    left: 20,
                    top: 20,
                    borderColor: '#B84DFF',
                    opacity: 0.6,
                    borderWidth: 2,
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
          <View style={[styles.statsCard, styles.cardGlow, { backgroundColor: colors.surface + 'F5', borderColor: colors.borderLight }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>This week</Text>
            {loadingDashboard ? (
              <View style={styles.dashLoader}>
                <Image
                  source={require('@/assets/images/loading.gif')}
                  style={{ width: 32, height: 32 }}
                />
              </View>
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{displayTaps}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taps</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{displayViews}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Views</Text>
                </View>
              </View>
            )}
          </View>

          {/* Recent messages */}
          <View style={[styles.recentCard, styles.cardGlow, { backgroundColor: colors.surface + 'F5', borderColor: colors.borderLight }]}>
            <View style={styles.recentHeader}>
              <View style={styles.recentHeaderTitleRow}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recent messages</Text>
                {recentMessages.some((c) => c.hasUnread) ? (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.unreadBadgeText, { color: colors.onAccent }]}>New</Text>
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
              <View style={styles.dashLoader}>
                <Image
                  source={require('@/assets/images/loading.gif')}
                  style={{ width: 32, height: 32 }}
                />
              </View>
            ) : recentMessages.length === 0 ? (
              <Text style={[styles.recentEmpty, { color: colors.textSecondary }]}>
                No messages yet. Message a saved contact to start.
              </Text>
            ) : (
              <View style={styles.recentMessagesList}>
                {recentMessages.map((conv) => (
                  <Link key={conv.id} href={`/messages/${conv.id}` as const} asChild>
                    <Pressable style={styles.recentMessageRow}>
                      <ProAvatar
                        avatarUrl={conv.peerAvatarUrl}
                        isPro={conv.peerIsPro}
                        size="small"
                        placeholderLetter={conv.peerName || '?'}
                        style={styles.recentAvatarWrap}
                      />
                      <View style={styles.recentInfo}>
                        <View style={styles.recentNameRow}>
                          {conv.hasUnread ? (
                            <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
                          ) : null}
                          <NameWithVerified
                            name={conv.peerName || 'Unknown'}
                            isPro={conv.peerIsPro}
                          />
                          {conv.hasUnread ? (
                            <Text style={[styles.recentNewLabel, { color: colors.accent }]}> · New</Text>
                          ) : null}
                        </View>
                        <Text style={[styles.recentTime, { color: colors.textSecondary }]} numberOfLines={1}>
                          {conv.lastMessageBody || 'No messages yet'}
                          {conv.lastMessageAt ? ` · ${dayjs(conv.lastMessageAt).fromNow()}` : ''}
                        </Text>
                      </View>
                    </Pressable>
                  </Link>
                ))}
              </View>
            )}
          </View>

          {/* Recently scanned cards */}
          <View style={[styles.recentCard, styles.cardGlow, { backgroundColor: colors.surface + 'F5', borderColor: colors.borderLight }]}>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recent contacts</Text>
              <Link href="/(tabs)/contacts" asChild>
                <Pressable>
                  <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
                </Pressable>
              </Link>
            </View>
            {loadingDashboard ? (
              <View style={styles.dashLoader}>
                <Image
                  source={require('@/assets/images/loading.gif')}
                  style={{ width: 32, height: 32 }}
                />
              </View>
            ) : recentContacts.length === 0 ? (
              <Text style={[styles.recentEmpty, { color: colors.textSecondary }]}>
                No scanned or saved contacts yet. Save a profile in the app or scan a card to see them here.
              </Text>
            ) : (
              recentContacts.slice(0, 5).map((item) => {
                const isSaved = item.type === 'saved';
                const id = item.data.id;
                const contactUserId = isSaved ? (item.data as SavedContact).contactUserId : null;
                const name = isSaved
                  ? (recentNameByUserId[contactUserId!] || (item.data as SavedContact).displayName || 'Saved contact').trim()
                  : getScannedContactDisplayName(item.data as ScannedContact);
                const createdAt = item.data.createdAt;
                const storedAvatar = (isSaved ? (item.data as SavedContact).avatarUrl : (item.data as ScannedContact).avatarUrl)?.trim() || null;
                const avatarUrl = isSaved ? (recentAvatarByUserId[contactUserId!] ?? storedAvatar ?? null) : null;
                const isPro = isSaved ? (recentIsProByUserId[contactUserId!] ?? false) : false;
                const row = isSaved ? (
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
                        {' · Saved'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.recentRow, { borderBottomColor: colors.borderLight }]}>
                    <View style={[styles.scannedRecentIcon, { backgroundColor: colors.accent + '33' }]}>
                      <Ionicons name="document-text-outline" size={20} color={colors.accent} />
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={[styles.recentName, { color: colors.text }]} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={[styles.recentTime, { color: colors.textSecondary }]}>
                        {dayjs(createdAt).fromNow()}
                      </Text>
                    </View>
                  </View>
                );
                return isSaved ? (
                  <Link key={`saved-${id}`} href={`/profile/${contactUserId}` as const} asChild>
                    <Pressable>{row}</Pressable>
                  </Link>
                ) : (
                  <Pressable key={`scanned-${id}`} onPress={() => router.push(`/(tabs)/contacts/scanned/${(item.data as ScannedContact).id}` as const)}>
                    {row}
                  </Pressable>
                );
              })
            )}
          </View>

          {/* Opportunities feed */}
          <View style={[styles.recentCard, styles.cardGlow, { backgroundColor: colors.surface + 'F5', borderColor: colors.borderLight }]}>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Opportunities</Text>
              <Pressable onPress={() => router.push('/(tabs)/profile/feed')}>
                <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
              </Pressable>
            </View>
            {opportunityPosts.length === 0 ? (
              <Text style={[styles.recentEmpty, { color: colors.textSecondary }]}>
                No opportunities from others yet. Check back for hiring, partnerships, or services.
              </Text>
            ) : (
              opportunityPosts.slice(0, 3).map((post) => {
                const typeLabel = { hiring: 'Hiring', partnerships: 'Partnerships', investments: 'Investments', services: 'Services', general: 'General' }[post.type] ?? post.type;
                const preview = (post.content ?? '').trim().slice(0, 60);
                const truncated = preview.length < (post.content ?? '').trim().length ? `${preview}…` : preview;
                return (
                  <Pressable
                    key={post.id}
                    style={[styles.opportunityRow, { borderBottomColor: colors.borderLight }]}
                    onPress={() => router.push('/(tabs)/profile/feed')}
                  >
                    <View style={styles.opportunityLineContent}>
                      <Text style={[styles.opportunityType, { color: colors.accent }]} numberOfLines={1}>
                        {typeLabel}
                      </Text>
                      <LinkableText
                        content={truncated || 'Opportunity'}
                        textStyle={[styles.opportunityPreview, { color: colors.text }]}
                        linkColor={colors.accent}
                        numberOfLines={1}
                      />
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </Pressable>
                );
              })
            )}
          </View>

          {/* Store card */}
          <Pressable
            style={[styles.storeCard, styles.cardGlow, { backgroundColor: colors.surface + 'F5', borderColor: colors.borderLight }]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Layout.screenPadding },
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
    justifyContent: 'center',
    marginTop: Layout.sectionGap,
    marginBottom: Layout.sectionGap + 32,
    marginHorizontal: Layout.sectionGap,
    paddingVertical: Layout.cardPadding,
    paddingBottom: Layout.cardPadding + 12,
    borderRadius: Layout.radiusXl,
  },
  scanRingGlowShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#00D4FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 40,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  dashboard: { gap: Layout.sectionGap },
  cardGlow: {
    ...Platform.select({
      ios: {
        shadowColor: '#6B7FD7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
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
  dashLoader: {
    paddingVertical: Layout.rowGap,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  recentNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' },
  recentNewLabel: { fontSize: 16, fontWeight: '600', flexShrink: 0 },
  seeAll: { fontSize: Layout.caption, fontWeight: '600' },
  recentEmpty: { fontSize: Layout.bodySmall, fontStyle: 'italic', paddingVertical: 8 },
  recentMessagesList: { gap: Layout.rowGap },
  recentMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    paddingVertical: 10,
    direction: 'ltr',
  },
  opportunityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  opportunityLineContent: { flex: 1, minWidth: 0 },
  opportunityType: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  opportunityPreview: { fontSize: 14 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    direction: 'ltr',
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
  recentAvatarWrap: { marginRight: 12, flexShrink: 0 },
  scannedRecentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
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
    alignSelf: 'center',
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
  scanRingLabel: { fontSize: Layout.titleSection + 1, fontWeight: '700', marginTop: 14, textAlign: 'center', alignSelf: 'stretch' },
  scanRingHint: { fontSize: Layout.caption, marginTop: 4, marginBottom: 16, textAlign: 'center', alignSelf: 'stretch' },
  nearbyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    marginBottom: Layout.sectionGap,
    gap: 12,
  },
  nearbyBannerText: { flex: 1, fontSize: 16, fontWeight: '600' },
});
