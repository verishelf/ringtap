import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import { deleteAccount, unlinkMyRings } from '@/lib/api';

const MENU_ICON_SIZE = 22;
const CHEVRON_SIZE = 20;
const ICON_BOX_SIZE = 28;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useSession();
  const { plan, isPro } = useSubscription();
  const { isLight, setTheme } = useAppearance();
  const { prefs: notifPrefs, setPrefs: setNotifPrefs, permissionStatus, requestPermission } = useNotifications();
  const colors = useThemeColors();
  const router = useRouter();
  const [unlinking, setUnlinking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleNewMessagesToggle = async (on: boolean) => {
    setNotifPrefs({ newMessages: on });
    if (on) await requestPermission();
  };

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { ok, error } = await deleteAccount();
            setDeleting(false);
            if (ok) {
              await signOut();
              router.replace('/(auth)/login');
            } else {
              Alert.alert('Could not delete account', error ?? 'Something went wrong.');
            }
          },
        },
      ]
    );
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.row, styles.rowBorder, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.label, { color: colors.text }]}>New messages</Text>
              <Switch
                value={notifPrefs.newMessages}
                onValueChange={handleNewMessagesToggle}
                trackColor={{ false: colors.borderLight, true: colors.accent }}
                thumbColor={colors.text}
              />
            </View>
            {permissionStatus === 'denied' && notifPrefs.newMessages && (
              <View style={styles.row}>
                <Text style={[styles.hint, { color: colors.textSecondary, flex: 1 }]}>
                  Notifications are off in system settings. Turn them on in Settings → RingTap to get alerts for new messages.
                </Text>
              </View>
            )}
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

        <View style={[styles.section, { marginTop: Layout.sectionGap }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ring</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Pressable
              style={[styles.menuItem, styles.rowBorder, { borderBottomColor: colors.borderLight }]}
              onPress={() => router.push('/activate')}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconBox, { width: ICON_BOX_SIZE, height: ICON_BOX_SIZE }]}>
                  <Ionicons name="ellipse-outline" size={MENU_ICON_SIZE} color={colors.accent} />
                </View>
                <Text style={[styles.menuText, { color: colors.text }]} numberOfLines={1}>Manage ring</Text>
              </View>
              <View style={styles.menuItemRight} pointerEvents="none">
                <Ionicons name="chevron-forward" size={CHEVRON_SIZE} color={colors.textSecondary} />
              </View>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={handleUnlinkRing}
              disabled={unlinking}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconBox, { width: ICON_BOX_SIZE, height: ICON_BOX_SIZE }]}>
                  <Ionicons name="link-outline" size={MENU_ICON_SIZE} color={colors.accent} />
                </View>
                <Text style={[styles.menuText, { color: colors.text }]} numberOfLines={1}>Unlink ring</Text>
              </View>
              {unlinking ? (
                <View style={styles.menuItemRight}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              ) : (
                <View style={styles.menuItemRight} pointerEvents="none">
                  <Ionicons name="chevron-forward" size={CHEVRON_SIZE} color={colors.textSecondary} />
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
                    <View style={[styles.iconBox, { width: ICON_BOX_SIZE, height: ICON_BOX_SIZE }]}>
                      <Ionicons name="card-outline" size={MENU_ICON_SIZE} color={colors.accent} />
                    </View>
                    <Text style={[styles.menuText, { color: colors.text }]}>Manage subscription</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    <Ionicons name="chevron-forward" size={CHEVRON_SIZE} color={colors.textSecondary} />
                  </View>
                </Pressable>
              </Link>
            ) : (
              <Link href="/(tabs)/settings/upgrade" asChild>
                <Pressable style={styles.menuItem}>
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.iconBox, { width: ICON_BOX_SIZE, height: ICON_BOX_SIZE }]}>
                      <Ionicons name="rocket-outline" size={MENU_ICON_SIZE} color={colors.accent} />
                    </View>
                    <Text style={[styles.menuText, { color: colors.text }]}>Upgrade to Pro</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    <Ionicons name="chevron-forward" size={CHEVRON_SIZE} color={colors.textSecondary} />
                  </View>
                </Pressable>
              </Link>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            style={[styles.card, styles.menuItem, { backgroundColor: colors.surface }]}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { width: ICON_BOX_SIZE, height: ICON_BOX_SIZE }]}>
                <Ionicons name="trash-outline" size={MENU_ICON_SIZE} color={colors.destructive} />
              </View>
              <Text style={[styles.menuText, styles.signOutText, { color: colors.destructive }]}>Delete account</Text>
            </View>
            {deleting ? (
              <View style={styles.menuItemRight}>
                <ActivityIndicator size="small" color={colors.destructive} />
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Pressable
              style={[styles.menuItem, styles.rowBorder, { borderBottomColor: colors.borderLight }]}
              onPress={() => router.push('/(tabs)/settings/about')}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconBox, { width: ICON_BOX_SIZE, height: ICON_BOX_SIZE }]}>
                  <Ionicons name="information-circle-outline" size={MENU_ICON_SIZE} color={colors.accent} />
                </View>
                <Text style={[styles.menuText, { color: colors.text }]} numberOfLines={1}>About & attributions</Text>
              </View>
              <View style={styles.menuItemRight} pointerEvents="none">
                <Ionicons name="chevron-forward" size={CHEVRON_SIZE} color={colors.textSecondary} />
              </View>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={handleSignOut}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconBox, { width: ICON_BOX_SIZE, height: ICON_BOX_SIZE }]}>
                  <Ionicons name="log-out-outline" size={MENU_ICON_SIZE} color={colors.destructive} />
                </View>
                <Text style={[styles.menuText, styles.signOutText, { color: colors.destructive }]}>Sign out</Text>
              </View>
            </Pressable>
          </View>
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
  hint: { fontSize: Layout.caption },
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
    gap: 12,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  iconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    minWidth: 24,
  },
  menuText: { fontSize: Layout.body, flexShrink: 1 },
  signOutText: {},
});
