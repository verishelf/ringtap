/**
 * Calendly OAuth callback — runs on Vercel (avoids Supabase Edge Function limits).
 * - Receives ?code and ?state (user_id) from Calendly redirect
 * - Exchanges code for tokens, stores in calendly_users
 * - Returns plain text so auth session closes
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  // Must match exactly what was sent in the authorization request (no trailing slash)
  const redirectUri = `${requestUrl.origin}${requestUrl.pathname}`;

  // Return 200 for errors — redirecting to self causes "too many redirects"
  if (errorParam) {
    return new NextResponse(`Error: ${errorParam}`, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (!code || !state) {
    return new NextResponse('Error: missing_params', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const clientId = process.env.CALENDLY_CLIENT_ID?.trim();
  const clientSecret = process.env.CALENDLY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    console.error('[Calendly OAuth] Missing CALENDLY_CLIENT_ID or CALENDLY_CLIENT_SECRET in Vercel env');
    return new NextResponse('Error: Add CALENDLY_CLIENT_ID and CALENDLY_CLIENT_SECRET to Vercel → Settings → Environment Variables', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  try {
    const tokenRes = await fetch('https://auth.calendly.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error('[Calendly OAuth] Token exchange failed', tokenRes.status, text);
      return new NextResponse('Error: token_exchange', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
      token_type?: string;
      expires_in: number;
    };

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').trim();
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

    if (!supabaseUrl || !serviceKey) {
      console.error('[Calendly OAuth] Missing Supabase config');
      return new NextResponse('Error: db_config', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { error } = await supabase.from('calendly_users').upsert(
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
      console.error('[Calendly OAuth] DB error', error);
      return new NextResponse('Error: db_failed', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    return new NextResponse('Closing…', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('[Calendly OAuth] Exception', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new NextResponse(`Error: ${msg}`, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
