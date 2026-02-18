/**
 * Calendly OAuth Callback Handler
 * - Receives ?code and ?state (user_id)
 * - Exchanges code for tokens, stores in calendly_users (profile fetched later by register-webhook)
 * - Returns plain text so auth session matches
 * - Minimal: 1 API call + DB write; fetch timeout prevents WallClockTime shutdown
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

const CALENDLY_REDIRECT_URI = 'ringtap://oauth/callback';

async function fetchTokens(code: string): Promise<TokenResponse> {
  const clientId = Deno.env.get('CALENDLY_CLIENT_ID');
  const clientSecret = Deno.env.get('CALENDLY_CLIENT_SECRET');
  const redirectUri = Deno.env.get('CALENDLY_REDIRECT_URI') ?? CALENDLY_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Calendly OAuth environment variables');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s max for Calendly API
  const response = await fetch('https://auth.calendly.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${text}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

const HANDLER_TIMEOUT_MS = 25000; // Fail before WallClockTime (150s free)

async function exchangeAndStore(code: string, state: string): Promise<Response> {
  const tokens = await fetchTokens(code);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const { error } = await getSupabase().from('calendly_users').upsert(
    {
      user_id: state,
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
    return new Response(JSON.stringify({ error: 'db_failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing Authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  let body: { code?: string; state?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const code = body.code?.trim();
  const state = body.state?.trim();
  if (!code || !state) {
    return new Response(JSON.stringify({ error: 'missing_params' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (state !== user.id) {
    return new Response(JSON.stringify({ error: 'state_mismatch' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  try {
    return await exchangeAndStore(code, state);
  } catch (err) {
    console.error('[Calendly OAuth] POST Exception:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const selfBase = `${url.origin}${url.pathname}`;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return Response.redirect(`${selfBase}?error=missing_params`, 302);
  }

  const run = async (): Promise<Response> => {
    const res = await exchangeAndStore(code, state);
    if (res.status !== 200) return Response.redirect(`${selfBase}?error=db_failed`, 302);
    return okResponse('Closing…');
  };

  const timeout = new Promise<Response>((_, reject) =>
    setTimeout(() => reject(new Error('Handler timeout')), HANDLER_TIMEOUT_MS)
  );

  try {
    return await Promise.race([run(), timeout]);
  } catch (err) {
    console.error('[Calendly OAuth] Exception:', err);
    const msg =
      err instanceof Error && err.name === 'AbortError'
        ? 'Calendly API timeout'
        : err instanceof Error
          ? err.message
          : 'Unknown error';
    return Response.redirect(`${selfBase}?error=${encodeURIComponent(msg)}`, 302);
  }
}

function okResponse(msg: string): Response {
  return new Response(msg, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
  });
}