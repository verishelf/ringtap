/**
 * Calendly OAuth Callback Handler (Updated)
 * ----------------------------------------
 * - Receives ?code and ?state (user_id)
 * - Exchanges code for tokens
 * - Fetches Calendly user profile
 * - Stores tokens in calendly_users table
 * - Redirects to RingTap OAuth status page
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface UserResponse {
  resource: {
    uri: string;
    name: string;
    email: string;
    scheduling_url: string;
    current_organization: string;
  };
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

async function fetchCalendlyUser(accessToken: string): Promise<UserResponse> {
  const res = await fetch('https://api.calendly.com/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendly user fetch failed: ${res.status} - ${text}`);
  }

  return (await res.json()) as UserResponse;
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

    // 1. Exchange the code for tokens
    const tokens = await fetchTokens(code);

    // 2. Fetch user profile
    const calendlyUser = await fetchCalendlyUser(tokens.access_token);

    // 3. Calculate expiry timestamp
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // 4. Store tokens in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase.from('calendly_users').upsert(
      {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type ?? 'Bearer',
        expires_at: expiresAt.toISOString(),
        calendly_user_uri: calendlyUser.resource.uri,
        calendly_organization: calendlyUser.resource.current_organization,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.error('[Calendly OAuth] Database error:', error);
      return Response.redirect(`${selfBase}?error=db_failed`, 302);
    }

    // 5. Return HTML so URL stays here — auth session matches and closes
    return htmlResponse('Connected!', null);
  } catch (err) {
    console.error('[Calendly OAuth] Exception:', err);
    const msg = encodeURIComponent(err instanceof Error ? err.message : 'Unknown error');
    return Response.redirect(`${selfBase}?error=${msg}`, 302);
  }
}

function htmlResponse(title: string, error: string | null): Response {
  const body = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0b;color:#fff;text-align:center;padding:20px}*{box-sizing:border-box}</style></head><body><p>${error ? `Error: ${error}` : 'Closing…'}</p></body></html>`;
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}