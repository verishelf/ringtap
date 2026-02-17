/**
 * Calendly OAuth flow for RingTap
 * - Generates OAuth URL
 * - Opens browser, waits for deep link ringtap://oauth/success
 * - Verifies tokens stored in Supabase
 */

import * as Linking from 'expo-linking';
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
  const result = await WebBrowser.openAuthSessionAsync(url, 'ringtap://oauth/success');

  if (result.type === 'success' && result.url) {
    const parsed = Linking.parse(result.url);
    if (parsed.path === 'oauth/success' || parsed.hostname === 'oauth') {
      return { success: true };
    }
    if (parsed.path === 'oauth/error' || parsed.queryParams?.error) {
      return {
        success: false,
        error: (parsed.queryParams?.error as string) ?? 'OAuth failed',
      };
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
