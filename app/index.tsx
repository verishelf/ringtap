import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSession } from '@/hooks/useSession';
import { getIndexPath, resolveAuthenticatedOnboardingRoute } from '@/lib/onboardingGate';

export default function IndexScreen() {
  const { session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (loading) return;
      if (!session?.user?.id) {
        router.replace(getIndexPath(false, false));
        return;
      }
      const dest = await resolveAuthenticatedOnboardingRoute(session.user.id);
      if (cancelled) return;
      router.replace(dest);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [session, loading, router]);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/splash-icon.png')}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
      />
      <View style={styles.splashOverlay} pointerEvents="none" />
      <Image
        source={require('@/assets/images/loading.gif')}
        style={{ width: 64, height: 64 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0B',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 11, 0.72)',
  },
});
