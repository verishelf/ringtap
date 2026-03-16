import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderBackButton } from '@/components/HeaderBackButton';
import { Layout } from '@/constants/theme';
import { useBadges } from '@/hooks/useBadges';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getBadges } from '@/services/badgeService';
import type { Badge } from '@/services/badgeService';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  sunrise: 'sunny',
  flame: 'flame',
  zap: 'flash',
  crown: 'trophy',
  refresh: 'refresh',
  radio: 'radio',
  'trending-up': 'trending-up',
  'person-add': 'person-add',
  people: 'people',
  globe: 'globe',
  link: 'link',
  layers: 'layers',
  eye: 'eye',
  star: 'star',
};

function getIcon(name: string): keyof typeof Ionicons.glyphMap {
  return ICON_MAP[name] ?? 'ribbon';
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16) || 0;
  const r = ((num >> 16) & 0xff) + amount * 255;
  const g = ((num >> 8) & 0xff) + amount * 255;
  const b = (num & 0xff) + amount * 255;
  const clamp = (n: number) => Math.round(Math.max(0, Math.min(255, n)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

/** Detailed how-to-earn text for each badge. */
const BADGE_HOW_TO: Record<string, string> = {
  early_bird: 'Open the RingTap app at least once on 3 consecutive days. Your streak resets if you miss a day, so check in daily!',
  week_warrior: 'Keep your streak going—open the app every day for 7 days in a row. Consistency is key.',
  streak_master: 'You\'re on fire! Open the app every day for 14 consecutive days. Don\'t break the chain.',
  monthly_legend: 'The ultimate commitment—open the app every single day for 30 days. You\'re a RingTap legend.',
  comeback_king: 'Take a break of 7 or more days, then open the app again. We\'re glad you\'re back!',
  first_tap: 'Share your profile using NFC (tap your ring or card) or by having someone scan your QR code. One tap is all it takes.',
  tap_enthusiast: 'Get 5 or more people to tap or scan your profile in a single week. Share at events, meetings, or coffee chats.',
  first_contact: 'Save someone to your contacts—tap their profile and choose "Save contact" when you connect.',
  networker: 'Build your network by saving 10 contacts. Each connection counts toward this badge.',
  super_connector: 'You\'re a networking pro! Save 50 contacts to your RingTap address book.',
  profile_starter: 'Add your first link to your profile—go to Links and add a website, social, or custom link.',
  link_pro: 'Add 5 or more links to your profile. Show off your LinkedIn, portfolio, calendar, and more.',
  profile_views_100: 'Your profile has been viewed 100 times. Keep sharing your ringtap.me link!',
  profile_views_1000: 'Your profile has reached 1,000 views. You\'re going viral on RingTap!',
};

const BADGE_SIZE = 100;

export default function BadgeDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const { allBadges } = useBadges();
  const [badge, setBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (slug && allBadges.length > 0) {
        const found = allBadges.find((b) => b.slug === slug);
        if (found) {
          setBadge({ ...found, sortOrder: found.sortOrder ?? 0 });
        } else {
          const badges = await getBadges();
          const b = badges.find((x) => x.slug === slug);
          setBadge(b ?? null);
        }
      } else if (slug) {
        const badges = await getBadges();
        const b = badges.find((x) => x.slug === slug);
        setBadge(b ?? null);
      }
      setLoading(false);
    };
    load();
  }, [slug, allBadges]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: colors.borderLight }]}>
          <HeaderBackButton onPress={() => router.back()} />
          <Text style={[styles.title, { color: colors.text }]}>Badge</Text>
        </View>
        <View style={styles.loading}>
          <Image source={require('@/assets/images/loading.gif')} style={{ width: 48, height: 48 }} />
        </View>
      </View>
    );
  }

  if (!badge) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: colors.borderLight }]}>
          <HeaderBackButton onPress={() => router.back()} />
          <Text style={[styles.title, { color: colors.text }]}>Badge</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Badge not found</Text>
        </View>
      </View>
    );
  }

  const earned = allBadges.find((b) => b.slug === slug)?.earned ?? false;
  const color = earned ? (badge.color ?? '#0a7ea4') : '#6B7280';
  const light = earned ? adjustColor(color, 0.25) : '#9CA3AF';
  const dark = earned ? adjustColor(color, -0.2) : '#4B5563';
  const howTo = BADGE_HOW_TO[badge.slug] ?? badge.description;
  const pillBg = earned ? `${badge.color ?? colors.accent}30` : `${colors.borderLight}50`;
  const pillColor = earned ? (badge.color ?? colors.accent) : colors.textSecondary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: colors.borderLight }]}>
        <HeaderBackButton onPress={() => router.back()} />
        <Text style={[styles.title, { color: colors.text }]}>{badge.name}</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeSection}>
          <View
            style={[
              styles.badgeWrap,
              Platform.select({
                ios: {
                  shadowColor: color,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: earned ? 0.4 : 0.2,
                  shadowRadius: 12,
                },
                android: { elevation: earned ? 8 : 4 },
              }),
            ]}
          >
            <LinearGradient
              colors={[light, color, dark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.badgeGradient,
                {
                  width: BADGE_SIZE,
                  height: BADGE_SIZE,
                  borderRadius: BADGE_SIZE * 0.22,
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.35)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
                style={[
                  styles.innerHighlight,
                  {
                    width: BADGE_SIZE,
                    height: BADGE_SIZE * 0.5,
                    borderTopLeftRadius: BADGE_SIZE * 0.22,
                    borderTopRightRadius: BADGE_SIZE * 0.22,
                  },
                ]}
              />
              <View style={[styles.iconWrap, { width: BADGE_SIZE, height: BADGE_SIZE }]}>
                <Ionicons
                  name={getIcon(badge.icon)}
                  size={BADGE_SIZE * 0.45}
                  color={earned ? '#FFFFFF' : '#D1D5DB'}
                />
              </View>
            </LinearGradient>
          </View>
          <View style={[styles.earnedPill, { backgroundColor: pillBg }]}>
            <Ionicons name={earned ? 'checkmark-circle' : 'lock-closed'} size={16} color={pillColor} />
            <Text style={[styles.earnedPillText, { color: pillColor }]}>
              {earned ? 'Earned' : 'Locked'}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>How to earn</Text>
        <View style={[styles.howToCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.howToText, { color: colors.text }]}>{howTo}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>Description</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{badge.description}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { padding: Layout.screenPadding },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16 },
  badgeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeWrap: {
    marginBottom: 12,
  },
  badgeGradient: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  iconWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  earnedPillText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  howToCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  howToText: {
    fontSize: 15,
    lineHeight: 24,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
});
