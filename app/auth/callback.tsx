/**
 * Handles email confirmation / magic link deep link.
 * Supabase redirects to me.ringtap.app://auth/callback#access_token=...&refresh_token=...
 * This screen extracts tokens, sets the session, and redirects to the app.
 */

import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase/supabaseClient';

function parseHashParams(url: string): Record<string, string> {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return {};
  const hash = url.slice(hashIndex + 1);
  const params: Record<string, string> = {};
  for (const pair of hash.split('&')) {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
    }
  }
  return params;
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleUrl = async (url: string | null) => {
      if (!url || !mounted) return;
      const params = parseHashParams(url);
      const accessToken = params.access_token ?? params['access_token'];
      const refreshToken = params.refresh_token ?? params['refresh_token'];

      if (!accessToken) {
        if (mounted) {
          setStatus('error');
          setErrorMsg('No token in link. Try signing in again.');
        }
        return;
      }

      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        });
        if (error) throw error;
        if (mounted) {
          setStatus('success');
          router.replace('/(tabs)');
        }
      } catch (e) {
        if (mounted) {
          setStatus('error');
          setErrorMsg(e instanceof Error ? e.message : 'Could not sign in');
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      } else {
        const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
        return () => sub.remove();
      }
    });

    return () => {
      mounted = false;
    };
  }, [router]);

  if (status === 'error') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{errorMsg}</Text>
        <Text
          style={[styles.link, { color: colors.accent }]}
          onPress={() => router.replace('/(auth)/login')}
        >
          Back to sign in
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>Confirming your email…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
  },
});
