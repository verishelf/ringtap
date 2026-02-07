import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import { unlinkMyRings } from '@/lib/api';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useSession();
  const { plan, isPro } = useSubscription();
  const { isLight, setTheme } = useAppearance();
  const colors = useThemeColors();
  const router = useRouter();
  const [unlinking, setUnlinking] = useState(false);

  const handleUnlinkRing = () => {
    Alert.alert(
      'Unlink ring',
      'This will unlink your NFC ring from your account. You can link it again later by tapping it and claiming it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            setUnlinking(true);
            const result = await unlinkMyRings();
            setUnlinking(false);
            if (result.success) {
              Alert.alert('Done', 'Your ring has been unlinked.');
            } else {
              Alert.alert('Error', result.error ?? 'Could not unlink ring');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => {
        await signOut();
        router.replace('/(auth)/login');
      } },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Layout.sectionGap }]}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.row, styles.rowBorder, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.label, { color: colors.text }]}>Light theme</Text>
              <Switch
                value={isLight}
                onValueChange={(on) => setTheme(on ? 'light' : 'dark')}
                trackColor={{ false: colors.borderLight, true: colors.accent }}
                thumbColor={colors.text}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.row, styles.rowBorder, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <Text style={[styles.value, { color: colors.textSecondary }]} numberOfLines={1}>{user?.email ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>Plan</Text>
              <Text style={[styles.value, isPro && styles.proBadge, { color: isPro ? colors.accent : colors.textSecondary }]}>{isPro ? 'Pro' : 'Free'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ring</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Link href="/activate" asChild>
              <Pressable style={[styles.menuItem, styles.rowBorder, styles.menuItemWithChevron, { borderBottomColor: colors.borderLight }]}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="phone-portrait-outline" size={22} color={colors.accent} />
                  <Text style={[styles.menuText, { color: colors.text }]}>Manage ring</Text>
                </View>
                <View style={[styles.menuItemRight, styles.chevronRight]} pointerEvents="none">
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </Pressable>
            </Link>
            <Pressable
              style={[styles.menuItem, styles.menuItemWithChevron]}
              onPress={handleUnlinkRing}
              disabled={unlinking}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="link-outline" size={22} color={colors.accent} />
                <Text style={[styles.menuText, { color: colors.text }]}>Unlink ring</Text>
              </View>
              {unlinking ? (
                <View style={[styles.menuItemRight, styles.chevronRight]}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              ) : (
                <View style={[styles.menuItemRight, styles.chevronRight]} pointerEvents="none">
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Subscription</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {isPro ? (
              <Link href="/(tabs)/settings/manage" asChild>
                <Pressable style={styles.menuItem}>
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="card-outline" size={22} color={colors.accent} />
                    <Text style={[styles.menuText, { color: colors.text }]}>Manage subscription</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </Pressable>
              </Link>
            ) : (
              <Link href="/(tabs)/settings/upgrade" asChild>
                <Pressable style={styles.menuItem}>
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="rocket-outline" size={22} color={colors.accent} />
                    <Text style={[styles.menuText, { color: colors.text }]}>Upgrade to Pro</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </Pressable>
              </Link>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Pressable style={[styles.card, styles.menuItem, { backgroundColor: colors.surface }]} onPress={handleSignOut}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out-outline" size={22} color={colors.destructive} />
              <Text style={[styles.menuText, styles.signOutText, { color: colors.destructive }]}>Sign out</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Layout.screenPadding },
  section: { marginBottom: Layout.sectionGap },
  sectionTitle: { fontSize: Layout.titleSection, fontWeight: '600', marginBottom: Layout.titleSectionMarginBottom },
  card: {
    borderRadius: Layout.radiusXl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.cardPadding,
    paddingHorizontal: Layout.cardPadding,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: Layout.body },
  value: { fontSize: Layout.body, maxWidth: '60%' },
  proBadge: { fontWeight: '600' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.cardPadding,
    paddingHorizontal: Layout.cardPadding,
    flexWrap: 'nowrap',
    width: '100%',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 8,
  },
  menuItemWithChevron: {
    position: 'relative',
  },
  chevronRight: {
    position: 'absolute',
    right: Layout.cardPadding,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  menuText: { fontSize: Layout.body, flexShrink: 1 },
  signOutText: {},
});
