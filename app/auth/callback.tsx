/**
 * Handles email confirmation / magic link deep link.
 * Supabase redirects to ringtap://auth/callback#access_token=...&refresh_token=...
 * This screen extracts tokens, sets the session, and redirects to the app.
 *
 * On iOS cold start, getInitialURL() can return null; we retry and use getLinkingURL as fallback.
 */

import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

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
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'timeout'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const handleUrl = async (url: string | null) => {
      if (!url || !mounted || handledRef.current) return;
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

      handledRef.current = true;
      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        });
        if (error) throw error;
        if (mounted) {
          setStatus('success');
          router.replace('/(tabs)/home');
        }
      } catch (e) {
        handledRef.current = false;
        if (mounted) {
          setStatus('error');
          setErrorMsg(e instanceof Error ? e.message : 'Could not sign in');
        }
      }
    };

    const tryGetUrl = async () => {
      const syncUrl = typeof Linking.getLinkingURL === 'function' ? Linking.getLinkingURL() : null;
      const asyncUrl = await Linking.getInitialURL();
      const url = syncUrl ?? asyncUrl;
      if (url) handleUrl(url);
    };

    tryGetUrl();

    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    const retryTimers: ReturnType<typeof setTimeout>[] = [];
    [200, 500, 1000].forEach((delay) => {
      retryTimers.push(
        setTimeout(async () => {
          if (mounted && status === 'loading' && !handledRef.current) {
            const url = await Linking.getInitialURL();
            if (url) handleUrl(url);
          }
        }, delay)
      );
    });

    const timeout = setTimeout(() => {
      if (mounted && status === 'loading' && !handledRef.current) {
        setStatus('timeout');
      }
    }, 5000);

    return () => {
      mounted = false;
      sub.remove();
      retryTimers.forEach((t) => clearTimeout(t));
      clearTimeout(timeout);
    };
  }, [router]);

  if (status === 'error') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{errorMsg}</Text>
        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Text style={[styles.link, { color: colors.accent }]}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'timeout') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          The confirmation link didn&apos;t load. This can happen on first open.
        </Text>
        <Text style={[styles.text, { color: colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
          Tap the link in your email again, or sign in with your email and password.
        </Text>
        <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.timeoutButton}>
          <Text style={[styles.link, { color: colors.accent }]}>Sign in</Text>
        </Pressable>
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
  timeoutButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
});
