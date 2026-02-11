/**
 * Upgrade to Pro screen
 *
 * Per Apple Guideline 3.1.1:
 * - US storefront: Redirect to Stripe (web checkout) to buy Pro
 * - Non-US: IAP only (no external payment links)
 */

import { Ionicons } from '@expo/vector-icons';
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

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useStorefrontCountry } from '@/hooks/useStorefrontCountry';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSession } from '@/hooks/useSession';
import {
  iapConnect,
  iapDisconnect,
  iapGetProducts,
  iapPurchase,
  iapRestore,
  iapSetPurchaseListener,
  type IAPProduct,
} from '@/lib/iap';
import { supabase } from '@/lib/supabase/supabaseClient';

const UPGRADE_BASE_URL = 'https://www.ringtap.me/upgrade';

export default function UpgradeScreen() {
  const colors = useThemeColors();
  const { user } = useSession();
  const { isPro, refresh } = useSubscription();
  const { isUSStorefront } = useStorefrontCountry();

  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [iapState, setIapState] = useState<'idle' | 'connecting' | 'loading' | 'purchasing' | 'restoring' | 'error'>('idle');
  const [externalLoading, setExternalLoading] = useState(false);

  const getAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token || !session.user?.id) return null;
    return { accessToken: session.access_token, userId: session.user.id };
  }, []);

  // IAP only for non-US storefronts (Apple requires IAP outside US)
  useEffect(() => {
    if (Platform.OS === 'web' || isUSStorefront) {
      setIapState('idle');
      return;
    }

    let mounted = true;
    const run = async () => {
      setIapState('connecting');
      const connected = await iapConnect();
      if (!mounted) return;
      if (!connected) {
        setIapState('error');
        return;
      }

      iapSetPurchaseListener(getAuth, (success) => {
        if (!mounted) return;
        setIapState('idle');
        if (success) refresh();
      });

      setIapState('loading');
      const prods = await iapGetProducts();
      if (!mounted) return;
      setProducts(prods);
      setIapState('idle');
    };
    run();
    return () => {
      mounted = false;
      iapDisconnect();
    };
  }, [getAuth, refresh, isUSStorefront]);

  const handlePurchase = async (productId: string) => {
    const email = user?.email?.trim();
    if (!email) {
      Alert.alert('Sign in required', 'Sign in so your Pro subscription is linked to your account.');
      return;
    }
    setIapState('purchasing');
    const ok = await iapPurchase(productId);
    setIapState('idle');
    if (ok) refresh();
  };

  const handleRestore = async () => {
    const auth = await getAuth();
    if (!auth) {
      Alert.alert('Sign in required', 'Sign in to restore your purchase.');
      return;
    }
    setIapState('restoring');
    const { restored, error } = await iapRestore(auth.accessToken, auth.userId);
    setIapState('idle');
    if (restored) {
      refresh();
      Alert.alert('Restored', 'Your Pro subscription has been restored.');
    } else {
      Alert.alert('Restore', error ?? 'No purchases to restore.');
    }
  };

  const handleExternalUpgrade = async () => {
    const email = user?.email?.trim();
    if (!email) {
      Alert.alert('Sign in required', 'Use the email from your RingTap account so your Pro subscription is linked.');
      return;
    }
    setExternalLoading(true);
    try {
      const params = new URLSearchParams({ email });
      if (user?.id) params.set('user_id', user.id);
      const url = `${UPGRADE_BASE_URL}?${params.toString()}`;
      const opened = await Linking.openURL(url);
      if (!opened) Alert.alert('Error', 'Could not open browser. Try again.');
    } catch {
      Alert.alert('Error', 'Could not open payment page. Try again.');
    } finally {
      setExternalLoading(false);
    }
  };

  const monthlyProduct = products.find((p) => p.productId === '006');
  const yearlyProduct = products.find((p) => p.productId === '007');
  const primaryProduct = monthlyProduct ?? products[0];
  const showStripe = isUSStorefront || Platform.OS === 'web';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Ionicons name="rocket-outline" size={48} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>Upgrade to Pro</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Unlimited links, themes, analytics, and video intro.
          </Text>
        </View>

        {showStripe ? (
          /* US or web: Stripe checkout */
          <>
            <Text style={[styles.price, { color: colors.text }]}>$9.99/mo or $99.99/yr</Text>
            <Pressable
              style={[styles.button, { backgroundColor: colors.accent }, externalLoading && styles.buttonDisabled]}
              onPress={handleExternalUpgrade}
              disabled={externalLoading}
            >
              {externalLoading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="open-outline" size={22} color={colors.text} />
                  <Text style={[styles.buttonText, { color: colors.text }]}>Upgrade to Pro</Text>
                </>
              )}
            </Pressable>
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              Opens the browser to subscribe via Stripe. Cancel anytime from Settings → Manage subscription.
            </Text>
          </>
        ) : (
          /* Non-US: IAP only */
          <>
            {(iapState === 'connecting' || iapState === 'loading') && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.accent} size="small" />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading subscription options…
                </Text>
              </View>
            )}

            {iapState === 'idle' && primaryProduct && (
              <>
                <Pressable
                  style={[styles.button, { backgroundColor: colors.accent }]}
                  onPress={() => handlePurchase(primaryProduct.productId)}
                  disabled={iapState !== 'idle'}
                >
                  <Ionicons name="cart-outline" size={22} color={colors.text} />
                  <Text style={[styles.buttonText, { color: colors.text }]}>
                    Subscribe via App Store – {primaryProduct.price}/mo
                  </Text>
                </Pressable>

                {yearlyProduct && yearlyProduct.productId !== primaryProduct.productId && (
                  <Pressable
                    style={[styles.buttonSecondary, { borderColor: colors.border, borderWidth: 1 }]}
                    onPress={() => handlePurchase(yearlyProduct.productId)}
                  >
                    <Text style={[styles.buttonTextSecondary, { color: colors.text }]}>
                      {yearlyProduct.price}/year
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.restoreButton}
                  onPress={handleRestore}
                  disabled={iapState !== 'idle'}
                >
                  <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
                    Restore purchases
                  </Text>
                </Pressable>
                <Text style={[styles.note, { color: colors.textSecondary }]}>
                  Subscribe via the App Store. Manage or cancel from Settings → Manage subscription.
                </Text>
              </>
            )}

            {(iapState === 'purchasing' || iapState === 'restoring') && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.accent} size="small" />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  {iapState === 'purchasing' ? 'Processing…' : 'Restoring…'}
                </Text>
              </View>
            )}

            {iapState === 'error' && (
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                In‑app purchase is temporarily unavailable. Try again later.
              </Text>
            )}
          </>
        )}

        {isPro && (
          <Text style={[styles.proBadge, { color: colors.accent }]}>You have Pro</Text>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Layout.screenPadding, paddingBottom: Layout.screenPaddingBottom },
  card: {
    alignItems: 'center',
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusLg,
    marginBottom: Layout.sectionGap,
  },
  title: { fontSize: 22, fontWeight: '700', marginTop: 16 },
  price: { fontSize: 28, fontWeight: '800', marginTop: Layout.tightGap, marginBottom: Layout.rowGap },
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
  buttonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.inputGap,
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
    marginBottom: Layout.rowGap,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: Layout.body, fontWeight: '600' },
  buttonTextSecondary: { fontSize: Layout.body, fontWeight: '500' },
  restoreButton: { paddingVertical: Layout.tightGap, marginBottom: Layout.sectionGap },
  restoreText: { fontSize: Layout.bodySmall },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.inputGap,
    marginBottom: Layout.sectionGap,
  },
  loadingText: { fontSize: Layout.bodySmall },
  errorText: { fontSize: Layout.bodySmall, marginBottom: Layout.sectionGap, textAlign: 'center' },
  externalSection: { marginTop: Layout.tightGap },
  divider: { height: 1, marginVertical: Layout.sectionGap },
  note: {
    fontSize: Layout.caption,
    marginTop: Layout.tightGap,
    textAlign: 'center',
    lineHeight: 20,
  },
  proBadge: { marginTop: Layout.sectionGap, fontWeight: '600' },
});
