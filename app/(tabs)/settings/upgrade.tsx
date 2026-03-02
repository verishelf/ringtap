/**
 * Upgrade to Pro screen
 *
 * Uses expo-in-app-purchases for App Store subscriptions.
 * IAP enabled in store builds (TestFlight, App Store). Use isStoreBuild() to gate the UI.
 * In Expo Go: shows web upgrade option.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSession } from '@/hooks/useSession';
import {
  IAP_FALLBACK_PRICES,
  iapConnect,
  iapPurchase,
  iapRestore,
} from '@/lib/iap';
import { isStoreBuild } from '@/utils/isStoreBuild';
import { fetchProducts, type IAPProduct } from '@/utils/fetchProducts';

const UPGRADE_BASE_URL = 'https://www.ringtap.me/upgrade';
const TERMS_URL = 'https://www.ringtap.me/terms';
const PRIVACY_URL = 'https://www.ringtap.me/privacy';

function LegalLinks({ colors }: { colors: { accent: string; textSecondary: string } }) {
  return (
    <View style={styles.legalLinks}>
      <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={[styles.linkText, { color: colors.accent }]}>Terms of Use</Text>
      </Pressable>
      <Text style={[styles.linkSeparator, { color: colors.textSecondary }]}> · </Text>
      <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={[styles.linkText, { color: colors.accent }]}>Privacy Policy</Text>
      </Pressable>
    </View>
  );
}

export default function UpgradeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { user, session } = useSession();
  const { isPro, refresh } = useSubscription();
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const [productsError, setProductsError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (!isStoreBuild() || Platform.OS === 'web') return;
    setLoading(true);
    setProductsError(null);
    try {
      const result = await fetchProducts();
      if (result.status === 'ok') {
        setProducts(result.products);
      } else {
        setProductsError(result.error ?? 'Could not load subscription options');
        setProducts([]);
      }
    } catch (e) {
      setProductsError(e instanceof Error ? e.message : 'Failed to load');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Pre-connect to App Store when screen loads (iPad/sandbox can be slow on first connect)
  useEffect(() => {
    if (isStoreBuild() && Platform.OS !== 'web') {
      iapConnect().catch(() => {});
    }
  }, []);

  const monthlyProduct = products.find((p) => p.productId === '006');
  const yearlyProduct = products.find((p) => p.productId === '007');

  const handlePurchase = useCallback(
    async (productId: string) => {
      if (!user?.id || !session?.access_token) {
        Alert.alert('Sign in required', 'Sign in so your Pro subscription is linked to your account.');
        return;
      }
      setPurchasingProductId(productId);
      try {
        const { purchased, error } = await iapPurchase(productId, session.access_token, user.id);
        if (purchased) {
          refresh();
          Alert.alert('Success', 'You now have Pro!');
        } else if (error && error !== 'Cancelled') {
          Alert.alert('Purchase failed', error);
        }
      } finally {
        setPurchasingProductId(null);
      }
    },
    [user?.id, session?.access_token, refresh]
  );

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!user?.id || !session?.access_token) {
      Alert.alert('Sign in required', 'Sign in to restore your Pro subscription.');
      return;
    }
    setRestoring(true);
    try {
      const { restored, error } = await iapRestore(session.access_token, user.id);
      if (restored) {
        refresh();
        Alert.alert('Restored', 'Your Pro subscription has been restored.');
      } else {
        Alert.alert('Restore failed', error ?? 'No purchases to restore.');
      }
    } finally {
      setRestoring(false);
    }
  }, [user?.id, session?.access_token, refresh]);

  const handleExternalUpgrade = useCallback(async () => {
    const email = user?.email?.trim();
    if (!email) {
      Alert.alert('Sign in required', 'Use the email from your RingTap account so your Pro subscription is linked.');
      return;
    }
    try {
      const params = new URLSearchParams({ email });
      if (user?.id) params.set('user_id', user.id);
      const url = `${UPGRADE_BASE_URL}?${params.toString()}`;
      const opened = await Linking.openURL(url);
      if (!opened) Alert.alert('Error', 'Could not open browser. Try again.');
    } catch {
      Alert.alert('Error', 'Could not open payment page. Try again.');
    }
  }, [user?.id, user?.email]);

  const isWebOnly = Platform.OS === 'web';
  const iapEnabled = isStoreBuild() && !isWebOnly;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + Layout.screenPadding,
            paddingBottom: insets.bottom + Layout.tabBarHeight + Layout.sectionGap,
          },
        ]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Ionicons name="rocket-outline" size={48} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>Upgrade to Pro</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Unlimited links, themes, analytics, and video intro.
          </Text>
        </View>

        {isWebOnly ? (
          <>
            <Text style={[styles.price, { color: colors.text }]}>$9.99/mo or $99.99/yr</Text>
            <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleExternalUpgrade} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="open-outline" size={22} color={colors.text} />
              <Text style={[styles.buttonText, { color: colors.text }]}>Upgrade to Pro</Text>
            </Pressable>
            <LegalLinks colors={colors} />
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              Opens the browser to subscribe via Stripe. Cancel anytime from Settings → Manage subscription.
            </Text>
          </>
        ) : !iapEnabled ? (
          <>
            <Text style={[styles.price, { color: colors.text }]}>$14.99/mo or $119.99/yr</Text>
            <View style={[styles.disabledMessage, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.disabledText, { color: colors.textSecondary }]}>
                In-app purchases require a development build. Use TestFlight or build with EAS to subscribe in-app.
              </Text>
            </View>
            <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleExternalUpgrade} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="open-outline" size={22} color={colors.text} />
              <Text style={[styles.buttonText, { color: colors.text }]}>Upgrade via web</Text>
            </Pressable>
            <LegalLinks colors={colors} />
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              Subscribe via the website. Cancel anytime from Settings → Manage subscription.
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.subscriptionTitle, { color: colors.text }]}>RingTap Pro</Text>
            <Text style={[styles.price, { color: colors.text }]}>
              {monthlyProduct?.price ?? IAP_FALLBACK_PRICES.monthly}/month or {yearlyProduct?.price ?? IAP_FALLBACK_PRICES.yearly}/year
            </Text>
            <Text style={[styles.subscriptionLength, { color: colors.textSecondary }]}>
              Auto-renewable subscription. Cancel anytime.
            </Text>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.accent} size="small" />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading subscription options…</Text>
              </View>
            ) : productsError ? (
              <View style={styles.errorRow}>
                <Text style={[styles.errorText, { color: colors.textSecondary }]}>{productsError}</Text>
                <Pressable
                  style={[styles.retryButton, { borderColor: colors.accent }]}
                  onPress={loadProducts}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={[styles.retryText, { color: colors.accent }]}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Pressable
                  style={[styles.button, { backgroundColor: colors.accent }, purchasingProductId && styles.buttonDisabled]}
                  onPress={() => handlePurchase('006')}
                  disabled={!!purchasingProductId}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  {purchasingProductId === '006' ? (
                    <ActivityIndicator color={colors.text} size="small" />
                  ) : (
                    <>
                      <Ionicons name="cart-outline" size={22} color={colors.text} />
                      <Text style={[styles.buttonText, { color: colors.text }]}>
                        Subscribe monthly — {monthlyProduct?.price ?? IAP_FALLBACK_PRICES.monthly}/mo
                      </Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.button, { backgroundColor: colors.accent }, purchasingProductId && styles.buttonDisabled]}
                  onPress={() => handlePurchase('007')}
                  disabled={!!purchasingProductId}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  {purchasingProductId === '007' ? (
                    <ActivityIndicator color={colors.text} size="small" />
                  ) : (
                    <>
                      <Ionicons name="cart-outline" size={22} color={colors.text} />
                      <Text style={[styles.buttonText, { color: colors.text }]}>
                        Subscribe yearly — {yearlyProduct?.price ?? IAP_FALLBACK_PRICES.yearly}/yr
                      </Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.button, styles.buttonOutlined, { borderColor: colors.borderLight }]}
                  onPress={handleRestore}
                  disabled={restoring}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  {restoring ? (
                    <ActivityIndicator color={colors.accent} size="small" />
                  ) : (
                    <Text style={[styles.buttonText, { color: colors.accent }]}>Restore purchases</Text>
                  )}
                </Pressable>
                <LegalLinks colors={colors} />
                <Text style={[styles.note, { color: colors.textSecondary }]}>
                  Subscribe via the App Store. Manage or cancel from Settings → Manage subscription.
                </Text>
              </>
            )}
          </>
        )}

        {isPro && <Text style={[styles.proBadge, { color: colors.accent }]}>You have Pro</Text>}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Layout.screenPadding },
  card: {
    alignItems: 'center',
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusLg,
    marginBottom: Layout.sectionGap,
  },
  title: { fontSize: 22, fontWeight: '700', marginTop: 16 },
  subscriptionTitle: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  price: { fontSize: 24, fontWeight: '800', marginTop: Layout.tightGap, marginBottom: 4 },
  subscriptionLength: { fontSize: Layout.caption, marginBottom: Layout.rowGap },
  subtitle: { fontSize: Layout.bodySmall + 1, marginTop: Layout.rowGap, textAlign: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.inputGap,
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
    marginBottom: Layout.rowGap,
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: { fontSize: Layout.body, fontWeight: '600' },
  buttonDisabled: { opacity: 0.7 },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.inputGap,
    marginBottom: Layout.sectionGap,
  },
  loadingText: { fontSize: Layout.bodySmall },
  errorRow: { alignItems: 'center', marginBottom: Layout.sectionGap },
  errorText: { fontSize: Layout.bodySmall, marginBottom: Layout.rowGap, textAlign: 'center' },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderRadius: Layout.radiusMd },
  retryText: { fontSize: Layout.body, fontWeight: '600' },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: Layout.tightGap,
  },
  linkText: { fontSize: Layout.caption, textDecorationLine: 'underline' },
  linkSeparator: { fontSize: Layout.caption },
  disabledMessage: {
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    marginBottom: Layout.sectionGap,
  },
  disabledText: { fontSize: Layout.body, textAlign: 'center' },
  note: {
    fontSize: Layout.caption,
    marginTop: Layout.tightGap,
    textAlign: 'center',
    lineHeight: 20,
  },
  proBadge: { marginTop: Layout.sectionGap, fontWeight: '600' },
});
