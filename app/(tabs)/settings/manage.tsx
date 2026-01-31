import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';

// Placeholder. In production you would:
// 1. Open Stripe Customer Portal (create portal session via backend, redirect to URL)
// 2. Or use Stripe React Native SDK to manage subscription
export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { plan, status, refresh } = useSubscription();
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      // TODO: Call backend to create Stripe Billing Portal session
      // const res = await fetch('YOUR_API/create-portal-session', { method: 'POST', body: JSON.stringify({ userId }) });
      // const { url } = await res.json();
      // await Linking.openURL(url);
      await new Promise((r) => setTimeout(r, 800));
      Alert.alert(
        'Manage subscription',
        'Stripe Customer Portal would open here. You can update payment method, cancel, or change plan. Subscription status is synced via Supabase webhooks.',
        [{ text: 'OK' }]
      );
      refresh();
    } catch (e) {
      Alert.alert('Error', 'Could not open billing portal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.planName, { color: colors.text }]}>Pro</Text>
          <Text style={[styles.status, { color: colors.textSecondary }]}>{status ?? 'active'}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Billing is managed by Stripe. Use the portal to update payment or cancel.</Text>
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: colors.accent }, loading && styles.buttonDisabled]}
          onPress={openPortal}
          disabled={loading}
        >
          <Ionicons name="open-outline" size={22} color={colors.text} />
          <Text style={[styles.buttonText, { color: colors.text }]}>Open Stripe billing portal</Text>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Layout.screenPadding, paddingBottom: Layout.screenPaddingBottom },
  card: {
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusLg,
    marginBottom: Layout.sectionGap,
  },
  planName: { fontSize: 20, fontWeight: '700' },
  status: { fontSize: Layout.bodySmall, marginTop: Layout.tightGap, textTransform: 'capitalize' },
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
