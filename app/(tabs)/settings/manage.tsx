import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase/supabaseClient';

const PORTAL_API_BASE = 'https://www.ringtap.me';

export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { plan, status, refresh } = useSubscription();
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.planName, { color: colors.text }]}>Pro</Text>
          <Text style={[styles.status, { color: colors.textSecondary }]}>{status ?? 'active'}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Update payment method or cancel your subscription. You keep Pro until the end of the current billing period.</Text>
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: colors.accent }, loading && styles.buttonDisabled]}
          onPress={openPortal}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <>
              <Ionicons name="open-outline" size={22} color={colors.text} />
              <Text style={[styles.buttonText, { color: colors.text }]}>Manage or cancel subscription</Text>
            </>
          )}
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
