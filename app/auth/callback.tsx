/**
 * Handles email confirmation / magic link deep link.
 * Supabase redirects to ringtap://auth/callback/#access_token=...&refresh_token=...
 * (or ?token_hash=...&type=email for PKCE)
 * This screen extracts tokens, sets the session, and redirects to the app.
 */

import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase/supabaseClient';

/** Parse params from URL hash (#) or query (?). Supabase may use either. */
function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const parts: string[] = [];
  if (hashIndex !== -1) parts.push(url.slice(hashIndex + 1));
  if (queryIndex !== -1 && (hashIndex === -1 || queryIndex < hashIndex)) {
    const q = url.slice(queryIndex + 1, hashIndex !== -1 ? hashIndex : undefined);
    parts.push(q);
  }
  for (const part of parts) {
    for (const pair of part.split('&')) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
      }
    }
  }
  return params;
}

function processAuthUrl(
  url: string,
  onSuccess: () => void,
  onError: (msg: string) => void
): void {
  const params = parseUrlParams(url);
  const accessToken = params.access_token ?? params['access_token'];
  const refreshToken = params.refresh_token ?? params['refresh_token'];
  const tokenHash = params.token_hash ?? params['token_hash'];
  const type = params.type ?? params['type'];

  if (tokenHash && type) {
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: type as 'email' })
      .then(({ error }) => {
        if (error) onError(error.message);
        else onSuccess();
      })
      .catch((e) => onError(e instanceof Error ? e.message : 'Could not sign in'));
    return;
  }

  if (!accessToken) {
    onError('No token in link. Try signing in again.');
    return;
  }

  supabase.auth
    .setSession({ access_token: accessToken, refresh_token: refreshToken ?? '' })
    .then(({ error }) => {
      if (error) throw error;
      onSuccess();
    })
    .catch((e) => onError(e instanceof Error ? e.message : 'Could not sign in'));
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-url'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const handled = useRef(false);

  const onSuccess = useCallback(() => {
    setStatus('success');
    router.replace('/(tabs)');
  }, [router]);

  const onError = useCallback((msg: string) => {
    setStatus('error');
    setErrorMsg(msg);
  }, []);

  const tryUrl = useCallback(
    (u: string | null) => {
      if (!u || handled.current) return;
      handled.current = true;
      processAuthUrl(u, onSuccess, onError);
    },
    [onSuccess, onError]
  );

  useEffect(() => {
    // 1. Synchronous: getLinkingURL (Expo native module, may have URL immediately)
    try {
      const syncUrl = Linking.getLinkingURL?.();
      if (syncUrl) tryUrl(syncUrl);
    } catch {
      // getLinkingURL may not exist on web
    }

    // 2. Async: getInitialURL (React Native Linking)
    Linking.getInitialURL().then(tryUrl);

    // 3. Listen for url event (when app opened from background via link)
    const sub = Linking.addEventListener('url', ({ url: u }) => tryUrl(u));

    // 4. Retries: URL can be delayed on cold start
    const delays = [300, 800, 1500, 3000];
    const timers = delays.map((ms) =>
      setTimeout(() => {
        if (!handled.current) Linking.getInitialURL().then(tryUrl);
      }, ms)
    );

    // 5. Timeout: show "no URL" after 6s so user can retry
    const noUrlTimer = setTimeout(() => {
      if (!handled.current) setStatus('no-url');
    }, 6000);

    return () => {
      sub.remove();
      timers.forEach(clearTimeout);
      clearTimeout(noUrlTimer);
    };
  }, [tryUrl]);

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

  if (status === 'no-url') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Could not read the confirmation link. Make sure you opened the link from your email, then
          try again.
        </Text>
        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Text style={[styles.link, { color: colors.accent }]}>Back to sign in</Text>
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
});
