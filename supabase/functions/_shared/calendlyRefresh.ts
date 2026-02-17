/**
 * Refresh Calendly OAuth token when expired
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function refreshCalendlyTokenIfNeeded(
  userId: string
): Promise<{ access_token: string } | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: cu } = await supabase
    .from('calendly_users')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!cu?.refresh_token) return null;

  const expiresAt = new Date(cu.expires_at);
  const now = new Date();
  if (expiresAt.getTime() - now.getTime() > 60 * 1000) {
    return { access_token: cu.access_token };
  }

  const clientId = Deno.env.get('CALENDLY_CLIENT_ID');
  const clientSecret = Deno.env.get('CALENDLY_CLIENT_SECRET');
  if (!clientId || !clientSecret) return { access_token: cu.access_token };

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: cu.refresh_token,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch('https://auth.calendly.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) return { access_token: cu.access_token };

  const tokens = (await res.json()) as TokenResponse;
  const newExpiresAt = new Date(Date.now() + (tokens.expires_in ?? 86400) * 1000);

  await supabase
    .from('calendly_users')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? cu.refresh_token,
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return { access_token: tokens.access_token };
}
