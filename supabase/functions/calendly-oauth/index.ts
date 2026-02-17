/**
 * Calendly OAuth callback handler
 * - Receives ?code from Calendly redirect
 * - Exchanges code for access + refresh tokens
 * - Stores tokens in calendly_users
 * - Redirects to ringtap://oauth/success
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
    throw new Error('Missing CALENDLY_CLIENT_ID, CALENDLY_CLIENT_SECRET, or CALENDLY_REDIRECT_URI');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch('https://auth.calendly.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  return (await res.json()) as TokenResponse;
}

async function fetchCalendlyUser(accessToken: string): Promise<UserResponse> {
  const res = await fetch('https://api.calendly.com/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendly user fetch failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json as UserResponse;
}

export async function GET(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id passed as state

    if (!code || !state) {
      const errorUrl = `ringtap://oauth/error?error=missing_params`;
      return Response.redirect(errorUrl, 302);
    }

    const userId = state;

    const tokens = await fetchTokens(code);
    const calendlyUser = await fetchCalendlyUser(tokens.access_token);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase.from('calendly_users').upsert(
      {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || 'Bearer',
        expires_at: expiresAt.toISOString(),
        calendly_user_uri: calendlyUser.resource.uri,
        calendly_organization: calendlyUser.resource.current_organization,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.error('calendly-oauth db error', error);
      return Response.redirect(`ringtap://oauth/error?error=db_failed`, 302);
    }

    return Response.redirect('ringtap://oauth/success', 302);
  } catch (e) {
    console.error('calendly-oauth', e);
    const msg = encodeURIComponent(e instanceof Error ? e.message : 'Unknown error');
    return Response.redirect(`ringtap://oauth/error?error=${msg}`, 302);
  }
}
