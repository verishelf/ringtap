import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { useSession } from '@/hooks/useSession';

/**
 * Deep link: ringtap://profile?uid=XXXX
 * If current user is the owner (user.id === uid), show Home.
 * Otherwise still navigate to Home (visitor taps open web, not app).
 */
export default function ProfileDeepLinkScreen() {
  const params = useLocalSearchParams<{ uid?: string }>();
  const uid = params.uid ?? '';
  const router = useRouter();
  const { user } = useSession();

  useEffect(() => {
    if (user?.id && uid && user.id === uid) {
      router.replace('/(tabs)');
      return;
    }
    router.replace('/(tabs)');
  }, [user?.id, uid, router]);

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
