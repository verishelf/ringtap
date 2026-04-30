import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProGateAnimatedContent } from '@/components/ProGateAnimatedContent';
import {
  ONBOARDING_UPSELL_LOADING_LABELS,
  getAppStoreReviewUrl,
} from '@/constants/onboardingLoading';
import { useRotatingLabel } from '@/hooks/useRotatingLabel';
import { useSession } from '@/hooks/useSession';
import { usePresentRevenueCatPaywall } from '@/hooks/usePresentRevenueCatPaywall';
import { useSubscription } from '@/hooks/useSubscription';
import {
  hasSeenOnboardingPaywall,
  markOnboardingPaywallSeen,
} from '@/lib/onboardingPaywallSeen';

const BG = '#FAFAFA';
const TEXT = '#111111';
const SUB = '#5C5C5C';

export default function OnboardingUpsellScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { isPro, loading } = useSubscription();
  const { presentPaywall, presentingPaywall } = usePresentRevenueCatPaywall(
    '/(tabs)/profile/upgrade' as Href,
    { fallbackReplace: true }
  );
  const skippedRef = useRef(false);
  const flowStartedRef = useRef(false);

  const upsellRotateIdle = !loading && !isPro && !presentingPaywall;
  const upsellRotatingLabel = useRotatingLabel(
    ONBOARDING_UPSELL_LOADING_LABELS,
    2800,
    upsellRotateIdle
  );

  useEffect(() => {
    if (loading) return;
    if (isPro) router.replace('/(tabs)/home');
  }, [isPro, loading, router]);

  useEffect(() => {
    const uid = user?.id;
    if (loading || isPro || !uid || skippedRef.current || flowStartedRef.current) return;
    flowStartedRef.current = true;
    let alive = true;
    (async () => {
      if (await hasSeenOnboardingPaywall(uid)) {
        if (alive) router.replace('/(tabs)/home');
        return;
      }
      let usedNativePaywallModal = false;
      try {
        usedNativePaywallModal = await presentPaywall();
      } catch {
        /* usePresentRevenueCatPaywall may alert; still finish flow */
      } finally {
        await markOnboardingPaywallSeen(uid);
        // Expo Go / no RevenueCat: we replace to Profile → Upgrade; don’t immediately replace home or the screen never shows.
        if (alive && !skippedRef.current && usedNativePaywallModal) {
          router.replace('/(tabs)/home');
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [loading, isPro, user?.id, presentPaywall, router]);

  const skipBasics = useCallback(async () => {
    skippedRef.current = true;
    if (user?.id) await markOnboardingPaywallSeen(user.id);
    router.replace('/(tabs)/home');
  }, [router, user?.id]);

  if (loading || isPro) {
    return <SafeAreaView style={[styles.safe, styles.min]} edges={['top', 'bottom']} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        <ProGateAnimatedContent style={styles.upsellGate}>
          <Text style={styles.headline}>Go further with Pro</Text>
          <Text style={styles.body}>
            Unlimited links, themes, analytics, and more.
          </Text>
          <View style={styles.spinnerWrap}>
            <ActivityIndicator size="large" color={TEXT} />
            <Text style={styles.spinnerHint}>
              {presentingPaywall ? 'Opening plans…' : upsellRotatingLabel}
            </Text>
          </View>
          <Pressable
            onPress={() => Linking.openURL(getAppStoreReviewUrl()).catch(() => {})}
            style={styles.reviewWrap}
            hitSlop={12}
          >
            <Text style={styles.reviewLink}>Leave us a review</Text>
          </Pressable>
          <Pressable onPress={skipBasics} style={styles.secondaryWrap} hitSlop={12}>
            <Text style={styles.secondary}>No thanks, give me the basics</Text>
          </Pressable>
        </ProGateAnimatedContent>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  min: { minHeight: 48 },
  upsellGate: { alignItems: 'center', width: '100%' },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
    color: SUB,
    marginBottom: 28,
  },
  spinnerWrap: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  spinnerHint: { fontSize: 15, color: SUB, textAlign: 'center', paddingHorizontal: 16 },
  reviewWrap: { alignItems: 'center', paddingVertical: 6, marginBottom: 8 },
  reviewLink: { fontSize: 15, fontWeight: '600', color: TEXT },
  secondaryWrap: { alignItems: 'center', paddingVertical: 8 },
  secondary: {
    fontSize: 16,
    fontWeight: '600',
    color: SUB,
    textDecorationLine: 'underline',
  },
});
