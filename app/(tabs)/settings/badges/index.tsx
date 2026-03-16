import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useSegments } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge3DTile } from '@/components/Badge3DTile';
import { HeaderBackButton } from '@/components/HeaderBackButton';
import { Layout } from '@/constants/theme';
import { useBadges } from '@/hooks/useBadges';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { BadgeWithEarned } from '@/services/badgeService';

const categoryLabels: Record<string, string> = {
  engagement: 'Coming back',
  sharing: 'Sharing',
  networking: 'Networking',
  profile: 'Profile',
  other: 'Other',
};

export default function BadgesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const colors = useThemeColors();
  const inProfile = segments.includes('profile');
  const { allBadges, badges, loading } = useBadges();

  const byCategory = allBadges.reduce<Record<string, BadgeWithEarned[]>>((acc, b) => {
    const cat = b.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(b);
    return acc;
  }, {});

  const earnedCount = badges.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: colors.borderLight }]}>
        <HeaderBackButton onPress={() => router.back()} />
        <Text style={[styles.title, { color: colors.text }]}>Badges</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Earn badges by opening the app, sharing your profile, and connecting with others.
        </Text>
        {loading ? (
          <View style={styles.loading}>
            <Image source={require('@/assets/images/loading.gif')} style={{ width: 48, height: 48 }} />
          </View>
        ) : allBadges.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="ribbon-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No badges yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Open the app regularly, share your profile with NFC or QR, and save contacts to earn your first badges.
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.earnedBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Ionicons name="ribbon" size={20} color={colors.accent} />
              <Text style={[styles.earnedText, { color: colors.text }]}>
                {earnedCount} of {allBadges.length} earned
              </Text>
            </View>
            {Object.entries(byCategory).map(([cat, items]) => (
              <View key={cat} style={styles.categorySection}>
                <Text style={[styles.categoryTitle, { color: colors.textSecondary }]}>
                  {categoryLabels[cat] ?? cat}
                </Text>
                <View style={styles.badgeGrid}>
                  {items.map((b) => (
                    <Pressable
                      key={b.id}
                      style={styles.badgeGridItem}
                      onPress={() => {
                      const base = inProfile ? '/(tabs)/profile/badges' : '/(tabs)/settings/badges';
                      router.push(`${base}/${b.slug}` as const);
                    }}
                    >
                      <Badge3DTile
                        badge={b}
                        size={70}
                        showLabel={true}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}
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
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  loading: { paddingVertical: 32, alignItems: 'center', justifyContent: 'center' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  categorySection: { marginBottom: 28 },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  badgeGridItem: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 16,
  },
  earnedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  earnedText: { fontSize: 14, fontWeight: '600' },
});
