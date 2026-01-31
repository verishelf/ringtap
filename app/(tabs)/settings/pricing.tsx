import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function PricingScreen() {
  const { isPro } = useSubscription();
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.planName, { color: colors.text }]}>Free</Text>
          <Text style={[styles.price, { color: colors.text }]}>$0</Text>
          <Text style={[styles.period, { color: colors.textSecondary }]}>forever</Text>
          <View style={styles.features}>
            <Feature text="2 links" colors={colors} />
            <Feature text="Basic profile" colors={colors} />
            <Feature text="Profile URL (ringtap.me/you)" colors={colors} />
            <Feature text="QR code" colors={colors} />
          </View>
          {!isPro && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>Current plan</Text>
            </View>
          )}
        </View>

        <View style={[styles.card, styles.proCard, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
          <Text style={[styles.planName, { color: colors.text }]}>Pro</Text>
          <Text style={[styles.price, { color: colors.text }]}>$9</Text>
          <Text style={[styles.period, { color: colors.textSecondary }]}>/ month</Text>
          <View style={styles.features}>
            <Feature text="Unlimited links" colors={colors} />
            <Feature text="Profile themes (accent, gradient, shapes)" colors={colors} />
            <Feature text="Analytics (views, clicks, NFC, QR)" colors={colors} />
            <Feature text="Video intro on profile (~20 sec)" colors={colors} />
          </View>
          {isPro ? (
            <Link href="/(tabs)/settings/manage" asChild>
              <Pressable style={[styles.manageButton, { borderColor: colors.accent }]}>
                <Text style={[styles.manageButtonText, { color: colors.accent }]}>Manage subscription</Text>
              </Pressable>
            </Link>
          ) : (
            <Link href="/(tabs)/settings/upgrade" asChild>
              <Pressable style={[styles.upgradeButton, { backgroundColor: colors.accent }]}>
                <Text style={[styles.upgradeButtonText, { color: colors.text }]}>Upgrade to Pro</Text>
              </Pressable>
            </Link>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function Feature({ text, colors }: { text: string; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
      <Text style={[styles.featureText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Layout.screenPadding, paddingBottom: Layout.screenPaddingBottom },
  card: {
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusLg,
    marginBottom: Layout.sectionGap,
    position: 'relative',
  },
  proCard: {
    borderWidth: 2,
  },
  planName: { fontSize: 20, fontWeight: '700', marginBottom: Layout.tightGap },
  price: { fontSize: 36, fontWeight: '800' },
  period: { fontSize: Layout.body, marginBottom: Layout.sectionGap },
  features: { gap: Layout.rowGap },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Layout.inputGap },
  featureText: { fontSize: Layout.bodySmall + 1 },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: Layout.rowGap,
    paddingVertical: 6,
    borderRadius: Layout.radiusPill,
  },
  badgeText: { fontSize: Layout.caption, fontWeight: '600' },
  upgradeButton: {
    marginTop: Layout.sectionGap,
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButtonText: { fontSize: Layout.body, fontWeight: '700' },
  manageButton: {
    marginTop: Layout.sectionGap,
    height: Layout.buttonHeight,
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageButtonText: { fontSize: Layout.body, fontWeight: '600' },
});
