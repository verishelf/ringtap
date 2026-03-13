import { Ionicons } from '@expo/vector-icons';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase/supabaseClient';

const PORTAL_API_BASE = 'https://www.ringtap.me';
/** App Store subscription management - open to manage IAP subscriptions */
const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';
const GOOGLE_PLAY_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions';

/** RevenueCat Customer Center is not available in Expo Go - use store URL fallback */
const canUseRevenueCatUI = Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { plan, status, refresh, hasStripeSubscription, hasRevenueCatSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);

  const openCustomerCenter = useCallback(async () => {
    if (Platform.OS === 'web') return;
    if (!canUseRevenueCatUI) {
      const url = Platform.OS === 'ios' ? APPLE_SUBSCRIPTIONS_URL : GOOGLE_PLAY_SUBSCRIPTIONS_URL;
      await Linking.openURL(url);
      return;
    }
    setLoading(true);
    try {
      const RevenueCatUI = require('react-native-purchases-ui').default;
      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onRestoreCompleted: () => refresh(),
          onRestoreFailed: () => refresh(),
        },
      });
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not open Customer Center';
      if (!msg.includes('Preview API') && !msg.includes('Native module')) {
        Alert.alert('Error', msg);
      }
      const url = Platform.OS === 'ios' ? APPLE_SUBSCRIPTIONS_URL : GOOGLE_PLAY_SUBSCRIPTIONS_URL;
      await Linking.openURL(url);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const openStripePortal = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      Alert.alert('Error', 'Please sign in again.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${PORTAL_API_BASE}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        Alert.alert('Could not open portal', data.error ?? 'Something went wrong.');
        return;
      }
      if (data.url) {
        const opened = await Linking.openURL(data.url);
        if (!opened) Alert.alert('Error', 'Could not open browser.');
        refresh();
      } else {
        Alert.alert('Error', 'No portal URL returned.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open billing portal. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const openStoreSubscriptions = async () => {
    const url = Platform.OS === 'ios' ? APPLE_SUBSCRIPTIONS_URL : GOOGLE_PLAY_SUBSCRIPTIONS_URL;
    const opened = await Linking.openURL(url);
    if (!opened) Alert.alert('Error', 'Could not open store.');
  };

  const handleManage = async () => {
    try {
      if (hasRevenueCatSubscription && canUseRevenueCatUI) {
        await openCustomerCenter();
      } else if (hasStripeSubscription) {
        await openStripePortal();
      } else {
        await openStoreSubscriptions();
      }
    } catch {
      const url = Platform.OS === 'ios' ? APPLE_SUBSCRIPTIONS_URL : GOOGLE_PLAY_SUBSCRIPTIONS_URL;
      await Linking.openURL(url);
    }
  };

  const subscriptionSource = hasRevenueCatSubscription
    ? 'App Store (RevenueCat)'
    : hasStripeSubscription
      ? 'Stripe'
      : 'App Store';

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderLight, paddingTop: insets.top, paddingBottom: 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Manage subscription</Text>
        <View style={styles.headerBack} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Layout.tabBarHeight + Layout.sectionGap }]} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.planName, { color: colors.text }]}>Pro</Text>
          <Text style={[styles.status, { color: colors.textSecondary }]}>{status ?? 'active'}</Text>
          <Text style={[styles.sourceLabel, { color: colors.textSecondary }]}>
            Billed via {subscriptionSource}
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Update payment method or cancel. You keep Pro until the end of the current billing period.
          </Text>
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: colors.accent }, loading && styles.buttonDisabled]}
          onPress={handleManage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <>
              <Ionicons name="open-outline" size={22} color={colors.text} />
              <Text style={[styles.buttonText, { color: colors.text }]}>
                {hasRevenueCatSubscription
                  ? 'Manage subscription'
                  : hasStripeSubscription
                    ? 'Manage Stripe billing'
                    : 'Manage in App Store'}
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center' },
  scroll: { padding: Layout.screenPadding },
  card: {
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusLg,
    marginBottom: Layout.sectionGap,
  },
  planName: { fontSize: 20, fontWeight: '700' },
  status: { fontSize: Layout.bodySmall, marginTop: Layout.tightGap, textTransform: 'capitalize' },
  sourceLabel: { fontSize: Layout.bodySmall, marginTop: Layout.tightGap, fontWeight: '500' },
  hint: { fontSize: Layout.bodySmall, marginTop: Layout.rowGap, lineHeight: 20 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.inputGap,
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: Layout.body, fontWeight: '600' },
});
