import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSession } from '@/hooks/useSession';
import { setupRingViaApi } from '@/lib/api';

export default function SetupRingByIdScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { user, session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleAssign = useCallback(async () => {
    if (!id || !session?.access_token) return;
    setLoading(true);
    try {
      const result = await setupRingViaApi(session.access_token, id);
      if (result.success) {
        Alert.alert(
          result.already_linked ? 'Already linked' : 'Ring linked!',
          result.already_linked
            ? 'This ring is already linked to your account.'
            : 'Your ring is now linked. Your username determines whose profile opens when someone taps it.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert('Could not link ring', result.error ?? 'Try again.');
      }
    } catch {
      Alert.alert('Error', 'Could not link ring. Try again.');
    } finally {
      setLoading(false);
    }
  }, [id, session?.access_token, router]);

  if (!id) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.textSecondary }]}>Invalid setup link.</Text>
        <Pressable onPress={() => router.back()} style={[styles.btn, { borderColor: colors.borderLight }]}>
          <Text style={{ color: colors.text }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Sign in to link this ring to your account.
        </Text>
        <Pressable onPress={() => router.replace('/(auth)/login')} style={[styles.primaryBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.primaryBtnText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Ionicons name="hardware-chip-outline" size={56} color={colors.accent} style={styles.icon} />
        <Text style={[styles.title, { color: colors.text }]}>Link your ring</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Assign this ring to your account. Your profile (ringtap.me/yourusername) will open when someone taps it.
        </Text>
        <Pressable
          onPress={handleAssign}
          disabled={loading}
          style={[styles.primaryBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Assign ring</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Layout.screenPadding },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Layout.radiusXl,
    borderWidth: 1,
    padding: Layout.cardPadding * 1.5,
    alignItems: 'center',
  },
  icon: { marginBottom: Layout.rowGap },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  message: { textAlign: 'center', marginBottom: Layout.rowGap * 1.5, fontSize: 15 },
  btn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: Layout.radiusMd, borderWidth: 1 },
  primaryBtn: { width: '100%', paddingVertical: 14, borderRadius: Layout.radiusMd, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
