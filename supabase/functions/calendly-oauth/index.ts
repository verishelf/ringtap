/**
 * Calendly OAuth Callback Handler
 * - Receives ?code and ?state (user_id)
 * - Exchanges code for tokens, stores in calendly_users (profile fetched later by register-webhook)
 * - Returns HTML so auth session matches
 * - Minimal: 1 API call + DB write to avoid WORKER_LIMIT
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  }
  return _supabase;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

async function fetchTokens(code: string): Promise<TokenResponse> {
  const clientId = Deno.env.get('CALENDLY_CLIENT_ID');
  const clientSecret = Deno.env.get('CALENDLY_CLIENT_SECRET');
  const redirectUri = Deno.env.get('CALENDLY_REDIRECT_URI');

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Calendly OAuth environment variables');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch('https://auth.calendly.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${text}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id (state param)

    const selfUrl = new URL(req.url);
    const selfBase = `${selfUrl.origin}${selfUrl.pathname}`;

    // Missing required params — redirect to self with error (keeps URL matching auth session)
    if (!code || !state) {
      return Response.redirect(`${selfBase}?error=missing_params`, 302);
    }

    const userId = state;

    const tokens = await fetchTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const { error } = await getSupabase().from('calendly_users').upsert(
      {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type ?? 'Bearer',
        expires_at: expiresAt.toISOString(),
        calendly_user_uri: null,
        calendly_organization: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.error('[Calendly OAuth] Database error:', error);
      return Response.redirect(`${selfBase}?error=db_failed`, 302);
    }

    return okResponse('Closing…');
  } catch (err) {
    console.error('[Calendly OAuth] Exception:', err);
    const msg = encodeURIComponent(err instanceof Error ? err.message : 'Unknown error');
    return Response.redirect(`${selfBase}?error=${msg}`, 302);
  }
}

function okResponse(msg: string): Response {
  return new Response(msg, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}