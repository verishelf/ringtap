import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { RingModelViewer } from '@/components/RingModelViewer';
import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { useThemeColors } from '@/hooks/useThemeColors';
import { claimRing, createAndClaimRing, getRingStatus, type RingStatus } from '@/lib/api';

export default function ActivateScreen() {
  const params = useLocalSearchParams<{ uid?: string; r?: string }>();
  const uid = (params.r ?? params.uid ?? '').trim();
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useSession();
  const [ring, setRing] = useState<RingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [linking, setLinking] = useState(false);

  const load = useCallback(async () => {
    if (!uid.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getRingStatus(uid);
      setRing(data);
      if (data?.status === 'claimed' && data.owner_user_id) {
        if (user?.id === data.owner_user_id) {
          router.replace('/(tabs)');
          return;
        }
        router.replace('/(tabs)');
        return;
      }
    } catch (_) {
      setRing(null);
    } finally {
      setLoading(false);
    }
  }, [uid, user?.id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClaim = async () => {
    if (!user?.id || !uid.trim()) {
      Alert.alert('Sign in required', 'Sign in to claim this ring.');
      router.replace('/(auth)/login');
      return;
    }
    if (ring?.status !== 'unclaimed') {
      Alert.alert('Already claimed', 'This ring is already linked to an account.');
      return;
    }
    setClaiming(true);
    try {
      const result = await claimRing(uid, user.id);
      if (result.success) {
        Alert.alert('Ring claimed', 'This ring is now linked to your account.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') },
        ]);
      } else {
        Alert.alert('Error', result.error ?? 'Could not claim ring');
      }
    } catch (_) {
      Alert.alert('Error', 'Could not claim ring');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading ring...</Text>
      </ThemedView>
    );
  }

  // No ring ID: first-tap flow — create a ring and assign to profile
  if (!uid.trim()) {
    const handleCreateAndLink = async () => {
      if (!user?.id) {
        Alert.alert('Sign in required', 'Sign in to link a ring to your profile.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign in', onPress: () => router.replace('/(auth)/login') },
        ]);
        return;
      }
      setLinking(true);
      try {
        const result = await createAndClaimRing(user.id);
        if (result.success) {
          Alert.alert(
            result.already_linked ? 'Already linked' : 'Ring linked',
            result.already_linked ? 'You already have a ring linked to your profile.' : 'Your ring is now linked to your profile.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
          );
        } else {
          Alert.alert('Error', result.error ?? 'Could not link ring');
        }
      } catch (_) {
        Alert.alert('Error', 'Could not link ring');
      } finally {
        setLinking(false);
      }
    };

    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.text }]}>Link your ring</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tap to create a ring and assign it to your profile. No ring ID needed — use the same link on any NFC ring.
          </Text>
          <View style={styles.modelWrap}>
            <RingModelViewer modelUrl={null} />
          </View>
          <Pressable
            style={[styles.claimButton, { backgroundColor: colors.accent }]}
            onPress={handleCreateAndLink}
            disabled={linking}
          >
            {linking ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="link" size={22} color={colors.primary} />
                <Text style={[styles.claimButtonText, { color: colors.primary }]}>
                  Create & link ring
                </Text>
              </>
            )}
          </Pressable>
          {!user ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Sign in first to link a ring to your profile.
            </Text>
          ) : null}
        </ScrollView>
      </ThemedView>
    );
  }

  if (!ring) {
    return (
      <ThemedView style={styles.container}>
        <Text style={[styles.errorText, { color: colors.text }]}>Could not load ring</Text>
        <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={load}>
          <Text style={[styles.buttonText, { color: colors.primary }]}>Retry</Text>
        </Pressable>
      </ThemedView>
    );
  }

  if (ring.status === 'claimed') {
    return (
      <ThemedView style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>This ring is already linked</Text>
        <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={() => router.replace('/(tabs)')}>
          <Text style={[styles.buttonText, { color: colors.primary }]}>Go to Home</Text>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Claim your ring</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Link this NFC ring to your RingTap account
        </Text>
        <View style={styles.modelWrap}>
          <RingModelViewer modelUrl={ring.model_url} />
        </View>
        <Pressable
          style={[styles.claimButton, { backgroundColor: colors.accent }]}
          onPress={handleClaim}
          disabled={claiming}
        >
          {claiming ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="link" size={22} color={colors.primary} />
              <Text style={[styles.claimButtonText, { color: colors.primary }]}>Claim Ring</Text>
            </>
          )}
        </Pressable>
        {!user ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Sign in to claim this ring.
          </Text>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.screenPadding,
  },
  scroll: {
    alignItems: 'center',
    paddingBottom: Layout.screenPaddingBottom,
  },
  loadingText: { marginTop: 12, fontSize: Layout.body },
  errorText: { fontSize: Layout.body, marginBottom: Layout.sectionGap },
  title: { fontSize: 24, fontWeight: '700', marginBottom: Layout.tightGap },
  subtitle: { fontSize: Layout.body, marginBottom: Layout.sectionGap, textAlign: 'center' },
  modelWrap: { width: '100%', marginBottom: Layout.sectionGap },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: Layout.radiusLg,
    minWidth: 200,
  },
  claimButtonText: { fontSize: Layout.body, fontWeight: '600' },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Layout.radiusMd,
  },
  buttonText: { fontSize: Layout.body, fontWeight: '600' },
  hint: { marginTop: Layout.rowGap, fontSize: Layout.caption },
});
