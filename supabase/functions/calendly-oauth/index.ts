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

    const redirectBase = `https://www.ringtap.me/oauth/calendly`;

    // Missing required params
    if (!code || !state) {
      return Response.redirect(
        `${redirectBase}?status=error&error=missing_params`,
        302
      );
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
      return Response.redirect(
        `${redirectBase}?status=error&error=db_failed`,
        302
      );
    }

    // 5. Redirect to success page
    return Response.redirect(
      `${redirectBase}?status=success`,
      302
    );

  } catch (err) {
    console.error('[Calendly OAuth] Exception:', err);
    const message = encodeURIComponent(err instanceof Error ? err.message : 'Unknown error');

    return Response.redirect(
      `https://www.ringtap.me/oauth/calendly?status=error&error=${message}`,
      302
    );
  }
}