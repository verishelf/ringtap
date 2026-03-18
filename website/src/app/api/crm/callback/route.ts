import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getRedirectUri } from '@/lib/crmConfig';
import { exchangeHubSpotCode } from '@/lib/integrations/hubspot';

function getSupabase() {
  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .trim();
  const supabaseUrl = rawUrl && !/^https?:\/\//i.test(rawUrl) ? 'https://' + rawUrl : rawUrl;
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/^["']|["']$/g, '').trim();
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Server missing Supabase config');
  }
  return createClient(supabaseUrl, serviceKey);
}

/**
 * HubSpot OAuth callback. HubSpot redirects here with ?code=...&state=...
 * We exchange the code for tokens, store in crm_connections, then redirect to app.
 */
async function handleCallback(request: NextRequest) {
  // HubSpot uses GET with query params; some providers use POST with form body
  const searchParams =
    request.method === 'POST'
      ? new URLSearchParams(await request.text()) // x-www-form-urlencoded
      : request.nextUrl.searchParams;

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const redirectUri = getRedirectUri();
  const appDeepLink = 'ringtap://settings/integrations';

  if (error) {
    const errDesc = searchParams.get('error_description') || error;
    return NextResponse.redirect(
      `${appDeepLink}?error=${encodeURIComponent(errDesc)}`
    );
  }

  if (!code) {
    const hint =
      'No authorization code received. Ensure https://www.ringtap.me/api/crm/callback is in HubSpot Auth → Redirect URLs.';
    return NextResponse.redirect(
      `${appDeepLink}?error=${encodeURIComponent('Missing code. ' + hint)}`
    );
  }

  const supabase = getSupabase();

  let stateRow: { user_id: string; provider: string } | null = null;

  if (state) {
    const { data, error: stateError } = await supabase
      .from('crm_oauth_state')
      .select('user_id, provider')
      .eq('state', state)
      .single();
    if (!stateError && data) stateRow = data;
  }

  // Fallback: HubSpot sometimes drops state when user signs in with Google.
  // If we have code but no state, use the most recent pending hubspot state (within 5 min).
  if (!stateRow && code) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: rows } = await supabase
      .from('crm_oauth_state')
      .select('user_id, provider, state')
      .eq('provider', 'hubspot')
      .gte('created_at', fiveMinAgo)
      .order('created_at', { ascending: false })
      .limit(2);
    if (rows?.length === 1) {
      stateRow = { user_id: rows[0].user_id, provider: rows[0].provider };
      await supabase.from('crm_oauth_state').delete().eq('state', rows[0].state);
    }
  }

  if (!stateRow) {
    const hint = state
      ? 'Invalid or expired state. Try connecting again.'
      : 'HubSpot dropped the state (common when signing in with Google). Log into app-na2.hubspot.com first, then try again.';
    return NextResponse.redirect(
      `${appDeepLink}?error=${encodeURIComponent('Could not complete connection. ' + hint)}`
    );
  }

  if (state) {
    await supabase.from('crm_oauth_state').delete().eq('state', state);
  }

  const { user_id: userId, provider } = stateRow;
  if (provider !== 'hubspot') {
    return NextResponse.redirect(
      `${appDeepLink}?error=${encodeURIComponent('Unsupported provider')}`
    );
  }

  try {
    const { accessToken, refreshToken, expiresIn } = await exchangeHubSpotCode(code, redirectUri);
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { error: upsertError } = await supabase.from('crm_connections').upsert(
      {
        user_id: userId,
        provider: 'hubspot',
        access_token_encrypted: accessToken,
        refresh_token_encrypted: refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,provider',
      }
    );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    return NextResponse.redirect(`${appDeepLink}?connected=hubspot`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(
      `${appDeepLink}?error=${encodeURIComponent(message)}`
    );
  }
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}
