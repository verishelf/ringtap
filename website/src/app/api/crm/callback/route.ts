import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAppUrl, getRedirectUri } from '@/lib/crmConfig';
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
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = getAppUrl();
  const redirectUri = getRedirectUri();
  const appDeepLink = 'ringtap://settings/integrations';

  if (error) {
    const errDesc = searchParams.get('error_description') || error;
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=${encodeURIComponent(errDesc)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=${encodeURIComponent('Missing code or state')}`
    );
  }

  const supabase = getSupabase();

  const { data: stateRow, error: stateError } = await supabase
    .from('crm_oauth_state')
    .select('user_id, provider')
    .eq('state', state)
    .single();

  if (stateError || !stateRow) {
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=${encodeURIComponent('Invalid or expired state')}`
    );
  }

  await supabase.from('crm_oauth_state').delete().eq('state', state);

  const { user_id: userId, provider } = stateRow;
  if (provider !== 'hubspot') {
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=${encodeURIComponent('Unsupported provider')}`
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

    return NextResponse.redirect(`${appUrl}/settings/integrations?connected=hubspot`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=${encodeURIComponent(message)}`
    );
  }
}
