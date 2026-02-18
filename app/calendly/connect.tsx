import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  disconnectCalendly,
  getConnectedCalendlyUrl,
  isCalendlyConnected,
  openCalendlyOAuth,
} from '@/lib/calendly/calendlyAuth';
import { supabase, supabaseUrl } from '@/lib/supabase/supabaseClient';

export default function ConnectCalendlyScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useSession();
  const [connected, setConnected] = useState(false);
  const [connectedUrl, setConnectedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const checkConnection = useCallback(async () => {
    if (!user?.id) {
      setConnected(false);
      setConnectedUrl(null);
      setLoading(false);
      return;
    }
    const isConnected = await isCalendlyConnected(user.id);
    setConnected(isConnected);
    setConnectedUrl(isConnected ? await getConnectedCalendlyUrl(user.id) : null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useFocusEffect(
    useCallback(() => {
      if (user) checkConnection();
    }, [user, checkConnection])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && user) checkConnection();
    });
    return () => sub.remove();
  }, [user, checkConnection]);

  const handleConnect = async () => {
    if (!user?.id) return;
    setConnecting(true);
    try {
      const { success, error } = await openCalendlyOAuth(user.id);
      if (success) {
        let verified = await isCalendlyConnected(user.id);
        if (!verified) {
          await new Promise((r) => setTimeout(r, 800));
          verified = await isCalendlyConnected(user.id);
        }
        if (!verified) {
          Alert.alert('Connection failed', 'Calendly could not be connected. Please try again.');
          return;
        }
        setConnected(true);
        await registerWebhook();
        router.push('/calendly/appointments');
      } else if (error && error !== 'Cancelled') {
        Alert.alert('Connection failed', error);
      }
    } finally {
      setConnecting(false);
      checkConnection();
    }
  };

  const registerWebhook = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/calendly-register-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    }).catch(() => {});
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Calendly',
      'This will remove your Calendly connection. Your appointments will no longer sync.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            await disconnectCalendly(user.id);
            setConnected(false);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.center, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom + Layout.sectionGap }]}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="calendar" size={48} color={colors.accent} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {connected ? 'Calendly connected' : 'Connect Calendly'}
        </Text>
        {connected && connectedUrl ? (
          <Text style={[styles.connectedAccount, { color: colors.textSecondary }]}>
            {connectedUrl}
          </Text>
        ) : null}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {connected
            ? 'Your appointments sync to RingTap. View them in My Appointments.'
            : 'Link your Calendly account to sync appointments and share booking links.'}
        </Text>

        {connected ? (
          <View style={styles.buttons}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/calendly/appointments')}
            >
              <Text style={[styles.primaryBtnText, { color: colors.primary }]}>View Appointments</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.borderLight }]}
              onPress={() => router.push('/calendly/links')}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Booking Links</Text>
            </Pressable>
            <Pressable
              style={[styles.dangerBtn, { borderColor: colors.destructive }]}
              onPress={handleDisconnect}
            >
              <Text style={[styles.dangerBtnText, { color: colors.destructive }]}>Disconnect</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            onPress={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons name="link" size={22} color={colors.primary} />
                <Text style={[styles.primaryBtnText, { color: colors.primary }]}>Connect Calendly</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Layout.screenPadding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', marginTop: Layout.sectionGap },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.sectionGap,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: Layout.tightGap, textAlign: 'center' },
  connectedAccount: { fontSize: Layout.bodySmall, textAlign: 'center', marginBottom: 4, fontFamily: 'monospace' },
  subtitle: { fontSize: Layout.bodySmall, textAlign: 'center', marginBottom: Layout.sectionGap, paddingHorizontal: 16 },
  buttons: { width: '100%', gap: Layout.rowGap, marginTop: Layout.sectionGap },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
  },
  primaryBtnText: { fontSize: Layout.body, fontWeight: '600' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: Layout.body, fontWeight: '600' },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    marginTop: Layout.rowGap,
  },
  dangerBtnText: { fontSize: Layout.body, fontWeight: '600' },
});
