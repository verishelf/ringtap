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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RingModelViewer } from '@/components/RingModelViewer';
import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { useSession } from '@/hooks/useSession';
import { useThemeColors } from '@/hooks/useThemeColors';
import { claimRing, getProfileUrlNfc, getRingStatus, type RingStatus } from '@/lib/api';
import { writeProfileUrlToNfcTag } from '@/lib/nfcWriter';

export default function ActivateScreen() {
  const params = useLocalSearchParams<{ uid?: string; r?: string }>();
  const uid = (params.r ?? params.uid ?? '').trim();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { profile } = useProfile();
  const [ring, setRing] = useState<RingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [writing, setWriting] = useState(false);

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
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading ring...</Text>
      </ThemedView>
    );
  }

  // No ring ID: first-tap flow — write profile URL to ring
  if (!uid.trim()) {
    const profileUrl = profile?.username ? getProfileUrlNfc(profile.username) : null;

    const handleWriteToRing = async () => {
      if (!profileUrl) {
        Alert.alert('Set username', 'Add a username in Profile first. Your link will be ringtap.me/username.');
        return;
      }
      setWriting(true);
      try {
        const result = await writeProfileUrlToNfcTag(profileUrl);
        if (result.success) {
          Alert.alert('Done', 'Your profile link is now on the ring. When someone taps it, your RingTap profile will open.');
        } else {
          if (result.error !== 'Cancelled') {
            Alert.alert('Write failed', result.error);
          }
        }
      } catch (_) {
        Alert.alert('Error', 'Could not write to ring');
      } finally {
        setWriting(false);
      }
    };

    return (
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Layout.sectionGap, paddingBottom: Math.max(insets.bottom, Layout.screenPaddingBottom) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.text }]}>Link your ring</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Write your profile link to the NFC ring so taps open your RingTap profile.
          </Text>
          <View style={styles.modelWrap}>
            <RingModelViewer modelUrl={null} />
          </View>

          {profileUrl ? (
            <>
              <Text style={[styles.writeLabel, { color: colors.textSecondary }]}>
                Your link: {profileUrl}
              </Text>
              <Pressable
                style={[styles.writeButton, { borderColor: colors.accent }]}
                onPress={handleWriteToRing}
                disabled={writing}
              >
                {writing ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <>
                    <Ionicons name="phone-portrait-outline" size={22} color={colors.accent} />
                    <Text style={[styles.writeButtonText, { color: colors.accent }]}>
                      Hold ring to phone to write
                    </Text>
                  </>
                )}
              </Pressable>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Hold your NFC ring flat against the back of your phone until it finishes.
              </Text>
            </>
          ) : (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Set a username in Profile first so your link is ringtap.me/username.
            </Text>
          )}
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
  writeLabel: { fontSize: Layout.caption, marginBottom: 8, textAlign: 'center' },
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Layout.radiusLg,
    borderWidth: 2,
    minWidth: 200,
  },
  writeButtonText: { fontSize: Layout.body, fontWeight: '600' },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Layout.radiusMd,
  },
  buttonText: { fontSize: Layout.body, fontWeight: '600' },
  hint: { marginTop: Layout.rowGap, fontSize: Layout.caption },
});
