import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { useSession } from '@/hooks/useSession';
import { useThemeColors } from '@/hooks/useThemeColors';

const RING_SIZE = 140;
const RING_STROKE = 3;
const INNER_CIRCLE = 64;

export default function HomeScreen() {
  const { user } = useSession();
  const { profile, loading } = useProfile();
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Hi{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your RingTap card</Text>
        </View>

        {/* Scan ring — tap to share */}
        <Link href="/share/nfc" asChild>
          <Pressable style={styles.scanRingWrap}>
            <View style={[styles.scanRingContainer, { width: RING_SIZE, height: RING_SIZE }]}>
              <View style={[styles.scanRingOuter, { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderColor: colors.borderLight }]} />
              <View style={[styles.scanRingMid, { width: RING_SIZE - 24, height: RING_SIZE - 24, borderRadius: (RING_SIZE - 24) / 2, borderColor: colors.accent, left: 12, top: 12 }]} />
              <View style={[styles.scanRingInner, { width: INNER_CIRCLE, height: INNER_CIRCLE, borderRadius: INNER_CIRCLE / 2, backgroundColor: colors.surface, left: (RING_SIZE - INNER_CIRCLE) / 2, top: (RING_SIZE - INNER_CIRCLE) / 2 }]}>
                <Ionicons name="phone-portrait-outline" size={28} color={colors.accent} />
              </View>
            </View>
            <Text style={[styles.scanRingLabel, { color: colors.text }]}>Tap to share</Text>
            <Text style={[styles.scanRingHint, { color: colors.textSecondary }]}>NFC or QR — your card, one tap</Text>
          </Pressable>
        </Link>

        <View style={styles.cards}>
          <Link href="/(tabs)/profile" asChild>
            <Pressable style={[styles.card, { backgroundColor: colors.surface }]}>
              <Ionicons name="person-circle-outline" size={36} color={colors.accent} />
              <View style={styles.cardTextWrap}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>Edit profile</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>Name, photo, bio, theme</Text>
              </View>
            </Pressable>
          </Link>

          <Link href="/(tabs)/links" asChild>
            <Pressable style={[styles.card, { backgroundColor: colors.surface }]}>
              <Ionicons name="link-outline" size={36} color={colors.accent} />
              <View style={styles.cardTextWrap}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>Links</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>Social, websites, buttons</Text>
              </View>
            </Pressable>
          </Link>

          <Link href="/share/nfc" asChild>
            <Pressable style={[styles.card, { backgroundColor: colors.surface }]}>
              <Ionicons name="phone-portrait-outline" size={36} color={colors.accent} />
              <View style={styles.cardTextWrap}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>NFC Share</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>Tap to share your card</Text>
              </View>
            </Pressable>
          </Link>

          <Link href="/share/qr" asChild>
            <Pressable style={[styles.card, { backgroundColor: colors.surface }]}>
              <Ionicons name="qr-code-outline" size={36} color={colors.accent} />
              <View style={[styles.cardTextWrap]}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>QR Code</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>Generate & share QR</Text>
              </View>
            </Pressable>
          </Link>

          <Link href="/(tabs)/analytics" asChild>
            <Pressable style={[styles.card, { backgroundColor: colors.surface }]}>
              <Ionicons name="stats-chart-outline" size={36} color={colors.accent} />
              <View style={styles.cardTextWrap}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>Analytics</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>Views, clicks, scans</Text>
              </View>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Layout.screenPadding, paddingBottom: Layout.screenPaddingBottom },
  header: { marginBottom: Layout.sectionGap },
  greeting: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: Layout.body, marginTop: 4 },
  scanRingWrap: {
    alignItems: 'center',
    marginBottom: Layout.sectionGap,
    paddingVertical: Layout.cardPadding,
  },
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
  cards: {
    gap: Layout.rowGap,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: Layout.cardPadding,
    borderRadius: Layout.radiusXl,
    width: '100%',
    maxWidth: 400,
  },
  cardTextWrap: { flex: 1, justifyContent: 'center', minWidth: 0 },
  cardTitle: { fontSize: Layout.titleSection, fontWeight: '600' },
  cardSubtitle: { fontSize: Layout.caption, marginTop: 2 },
});
