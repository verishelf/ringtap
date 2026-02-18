/**
 * Calendly OAuth flow for RingTap (TestFlight)
 * - Uses ringtap://oauth/callback as redirect URI
 * - Opens browser, Calendly redirects to app with code
 * - App exchanges code via Vercel API
 */

import * as WebBrowser from 'expo-web-browser';
import { supabase, supabaseUrl } from '@/lib/supabase/supabaseClient';
import { CALENDLY_REDIRECT_URI } from '@/lib/calendly';

const CALENDLY_CLIENT_ID = process.env.EXPO_PUBLIC_CALENDLY_CLIENT_ID ?? '';

export function getCalendlyOAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: CALENDLY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: CALENDLY_REDIRECT_URI,
    state: userId,
  });
  return `https://auth.calendly.com/oauth/authorize?${params.toString()}`;
}

/** Called from useActivation when app opens via ringtap://oauth/callback (cold start) */
export async function exchangeCalendlyCodeFromUrl(code: string, state: string): Promise<void> {
  await exchangeCalendlyCode(code, state);
}

async function exchangeCalendlyCode(code: string, state: string): Promise<{ success: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { success: false, error: 'Not signed in' };
  const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/calendly-oauth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ code, state }),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok) return { success: false, error: data.error ?? 'Exchange failed' };
  return { success: true };
}

export async function openCalendlyOAuth(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!CALENDLY_CLIENT_ID) {
    return { success: false, error: 'Calendly not configured' };
  }

  const url = getCalendlyOAuthUrl(userId);
  const result = await WebBrowser.openAuthSessionAsync(url, CALENDLY_REDIRECT_URI);

  if (result.type === 'success' && result.url) {
    try {
      const parsed = new URL(result.url);
      const code = parsed.searchParams.get('code');
      const state = parsed.searchParams.get('state');
      const errorParam = parsed.searchParams.get('error');
      if (errorParam) return { success: false, error: errorParam };
      if (code && state) {
        const exchange = await exchangeCalendlyCode(code, state);
        return exchange;
      }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'OAuth failed' };
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

/** Returns the connected Calendly scheduling URL (e.g. calendly.com/username) or null */
export async function getConnectedCalendlyUrl(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('calendly_users')
    .select('scheduling_url')
    .eq('user_id', userId)
    .maybeSingle();
  const url = data?.scheduling_url?.trim();
  if (!url) return null;
  // Show friendly format: calendly.com/username
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname === 'calendly.com' ? u.hostname + u.pathname : url;
  } catch {
    return url;
  }
}

export async function disconnectCalendly(userId: string): Promise<boolean> {
  const { error } = await supabase.from('calendly_users').delete().eq('user_id', userId);
  return !error;
}
