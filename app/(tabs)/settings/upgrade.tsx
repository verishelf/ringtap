import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

// Placeholder for Stripe checkout. In production you would:
// 1. Create a Stripe Checkout Session via your backend (Supabase Edge Function or API)
// 2. Redirect to Stripe Checkout URL or use Stripe React Native SDK
// 3. Handle success/cancel and sync subscription via Supabase webhooks
export default function UpgradeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // TODO: Call your backend to create Stripe Checkout Session
      // const res = await fetch('YOUR_API/create-checkout-session', { method: 'POST', body: JSON.stringify({ userId, plan: 'pro' }) });
      // const { url } = await res.json();
      // await Linking.openURL(url);
      // For demo: simulate success
      await new Promise((r) => setTimeout(r, 1500));
      Alert.alert(
        'Pro upgrade',
        'Stripe checkout would open here. After payment, your subscription is synced via Supabase webhooks.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Ionicons name="rocket-outline" size={48} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>Upgrade to Pro</Text>
          <Text style={[styles.price, { color: colors.text }]}>$9/month</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Unlimited links, themes, analytics, and video intro. Billing handled securely by Stripe.
          </Text>
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: colors.accent }, loading && styles.buttonDisabled]}
          onPress={handleUpgrade}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <>
              <Ionicons name="card-outline" size={22} color={colors.text} />
              <Text style={[styles.buttonText, { color: colors.text }]}>Continue to payment (Stripe)</Text>
            </>
          )}
        </Pressable>

        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Stripe billing is integrated via Supabase webhooks. Set up your backend to create Checkout
          sessions and sync subscription status to the subscriptions table.
        </Text>
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
  price: { fontSize: 28, fontWeight: '800', marginTop: Layout.tightGap },
  subtitle: { fontSize: Layout.bodySmall + 1, marginTop: Layout.rowGap, textAlign: 'center' },
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
  note: {
    fontSize: Layout.caption,
    marginTop: Layout.sectionGap,
    textAlign: 'center',
    lineHeight: 20,
  },
});
