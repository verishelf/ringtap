/**
 * Calendly OAuth flow for RingTap
 * - Generates OAuth URL
 * - Opens browser, waits for redirect to https://www.ringtap.me/oauth/calendly
 * - Verifies tokens stored in Supabase
 */

import * as WebBrowser from 'expo-web-browser';
import { supabase, supabaseUrl } from '@/lib/supabase/supabaseClient';

const CALENDLY_CLIENT_ID = process.env.EXPO_PUBLIC_CALENDLY_CLIENT_ID ?? '';
const OAUTH_REDIRECT_URI = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/calendly-oauth`;

export function getCalendlyOAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: CALENDLY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: OAUTH_REDIRECT_URI,
    state: userId,
  });
  return `https://auth.calendly.com/oauth/authorize?${params.toString()}`;
}

export async function openCalendlyOAuth(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!CALENDLY_CLIENT_ID) {
    return { success: false, error: 'Calendly not configured' };
  }

  const url = getCalendlyOAuthUrl(userId);
  const redirectUrl = 'https://www.ringtap.me/oauth/calendly';
  const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);

  if (result.type === 'success' && result.url) {
    try {
      const parsed = new URL(result.url);
      const status = parsed.searchParams.get('status');
      const errorParam = parsed.searchParams.get('error');
      if (status === 'success') return { success: true };
      if (status === 'error' || errorParam) {
        return { success: false, error: errorParam ?? 'OAuth failed' };
      }
    } catch {
      // Fallback for ringtap:// deep link (useActivation may have handled it)
      if (result.url.includes('oauth/success')) return { success: true };
      if (result.url.includes('oauth/error')) return { success: false, error: 'OAuth failed' };
    }
  }

  if (result.type === 'cancel') {
    return { success: false, error: 'Cancelled' };
  }

  return { success: false, error: 'Unknown error' };
}

export async function isCalendlyConnected(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('calendly_users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function disconnectCalendly(userId: string): Promise<boolean> {
  const { error } = await supabase.from('calendly_users').delete().eq('user_id', userId);
  return !error;
}
