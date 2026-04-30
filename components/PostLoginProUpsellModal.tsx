import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { PRO_UPGRADE_FEATURE_ITEMS } from '@/constants/proUpgradeFeatures';
import {
  ActivityIndicator,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

import { Layout } from '@/constants/theme';
import { usePresentRevenueCatPaywall } from '@/hooks/usePresentRevenueCatPaywall';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';

const DELAY_MS = 3200;

/**
 * Shown once per app session a few seconds after a free user reaches the main tab shell.
 */
export function PostLoginProUpsellModal() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const { user } = useSession();
  const { isPro, loading: subLoading } = useSubscription();
  const inProfileStack = Array.isArray(segments) && segments.includes('profile') && segments[segments.length - 1] !== 'index';
  const upgradeHref = (inProfileStack ? '/(tabs)/profile/upgrade' : '/(tabs)/settings/upgrade') as Href;
  const { presentPaywall, presentingPaywall } = usePresentRevenueCatPaywall(upgradeHref);

  const [visible, setVisible] = useState(false);
  const sessionDoneRef = useRef(false);

  useEffect(() => {
    if (!user?.id) {
      sessionDoneRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (isPro) setVisible(false);
  }, [isPro]);

  useEffect(() => {
    if (!user?.id || subLoading || isPro || sessionDoneRef.current) return;
    const t = setTimeout(() => {
      if (sessionDoneRef.current) return;
      sessionDoneRef.current = true;
      setVisible(true);
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, [user?.id, subLoading, isPro]);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const handleViewPlans = useCallback(() => {
    setVisible(false);
    // Dismiss this Modal first, then show RevenueCat’s paywall. Presenting back-to-back modals
    // on iOS can fail; wait until interactions/animation settle (same pattern as other sheets).
    InteractionManager.runAfterInteractions(() => {
      void presentPaywall();
    });
  }, [presentPaywall]);

  const handleOpenUpgradePage = useCallback(() => {
    setVisible(false);
    router.push(upgradeHref);
  }, [router, upgradeHref]);

  if (Platform.OS === 'web') return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel="Close" />
        <View
          style={[
            styles.sheet,
            {
              marginBottom: insets.bottom + 12,
              maxHeight: '82%',
            },
          ]}
        >
          <View style={styles.sheetArt} pointerEvents="none">
            <Image
              source={require('@/assets/images/splash-icon.png')}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
            />
            <View
              style={[styles.sheetArtOverlay, { backgroundColor: colors.background }]}
            />
          </View>
          <View style={styles.sheetContent}>
            <View style={styles.handleHint}>
              <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />
            </View>
            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
            <View style={[styles.badge, { backgroundColor: colors.accent + '22' }]}>
              <Ionicons name="sparkles" size={20} color={colors.accent} />
              <Text style={[styles.badgeText, { color: colors.accent }]}>Pro</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Upgrade to Pro</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Get the full RingTap experience on the Free plan, or go Pro for everything below.
            </Text>
            <View style={styles.list}>
              {PRO_UPGRADE_FEATURE_ITEMS.map((f) => (
                <View key={f.text} style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
                    <Ionicons name={f.icon as ComponentProps<typeof Ionicons>['name']} size={22} color={colors.accent} />
                  </View>
                  <Text style={[styles.rowText, { color: colors.text }]}>{f.text}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={handleViewPlans}
              disabled={presentingPaywall}
              style={[styles.primary, { backgroundColor: colors.accent }, presentingPaywall && { opacity: 0.75 }]}
            >
              {presentingPaywall ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={20} color={colors.onAccent} />
                  <Text style={[styles.primaryText, { color: colors.onAccent }]}>View Pro plans</Text>
                </>
              )}
            </Pressable>
            <Pressable onPress={handleOpenUpgradePage} style={styles.secondaryPress}>
              <Text style={[styles.secondary, { color: colors.accent }]}>Compare plans & pricing</Text>
            </Pressable>
            <Pressable onPress={close} style={styles.tertiaryPress} hitSlop={12}>
              <Text style={[styles.tertiary, { color: colors.textSecondary }]}>Not now</Text>
            </Pressable>
          </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  /** Softer than heavy black so the sheet reads clearly against the rest of the app */
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.33)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderTopLeftRadius: Layout.radiusXl,
    borderTopRightRadius: Layout.radiusXl,
    paddingTop: 8,
    overflow: 'hidden',
  },
  /** Splash art + frosted layer so text stays legible in light and dark */
  sheetArt: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetArtOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  sheetContent: {
    zIndex: 1,
  },
  handleHint: { alignItems: 'center', paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  scroll: { paddingHorizontal: Layout.screenPadding, paddingBottom: Layout.sectionGap },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Layout.radiusPill,
    marginBottom: Layout.tightGap,
  },
  badgeText: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: Layout.sectionGap },
  list: { gap: Layout.rowGap, marginBottom: Layout.sectionGap },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Layout.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { fontSize: 15, lineHeight: 22, flex: 1, minWidth: 0, paddingTop: 2 },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
  },
  primaryText: { fontSize: 16, fontWeight: '700' },
  secondaryPress: { alignItems: 'center', paddingVertical: 14 },
  secondary: { fontSize: 16, fontWeight: '600' },
  tertiaryPress: { alignItems: 'center', paddingVertical: 8, marginTop: 4 },
  tertiary: { fontSize: 15, fontWeight: '500' },
});
