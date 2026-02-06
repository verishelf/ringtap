import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSession } from '@/hooks/useSession';

const UPGRADE_BASE_URL = 'https://www.ringtap.me/upgrade';

export default function UpgradeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useSession();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    const email = user?.email?.trim();
    if (!email) {
      Alert.alert('Sign in required', 'Use the email from your RingTap account so your Pro subscription is linked.');
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ email });
      if (user?.id) params.set('user_id', user.id);
      const url = `${UPGRADE_BASE_URL}?${params.toString()}`;
      const opened = await Linking.openURL(url);
      if (!opened) Alert.alert('Error', 'Could not open browser. Try again.');
    } catch (e) {
      Alert.alert('Error', 'Could not open payment page. Try again.');
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
              <Ionicons name="open-outline" size={22} color={colors.text} />
              <Text style={[styles.buttonText, { color: colors.text }]}>Open in browser to buy Pro</Text>
            </>
          )}
        </Pressable>

        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Opens Safari (or your default browser) to complete payment. $9/month, cancel anytime. Secure checkout by Stripe.
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
