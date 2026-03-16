import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import {
  createHubSpotContact,
  refreshHubSpotToken,
  searchHubSpotContactByEmail,
} from '@/lib/integrations/hubspot';
import {
  mapSavedContactToHubSpot,
  mapScannedContactToHubSpot,
  type SyncResult,
} from '@/lib/crmSyncService';

function getSupabaseAdmin() {
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

function getSupabaseAnon(token: string) {
  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .trim();
  const supabaseUrl = rawUrl && !/^https?:\/\//i.test(rawUrl) ? 'https://' + rawUrl : rawUrl;
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^["']|["']$/g, '').trim();
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function getAppUrl(): string {
  const url = (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .trim();
  return url.startsWith('http') ? url : `https://${url}`;
}

/**
 * POST - Sync contacts to connected CRM (HubSpot).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    const supabaseAnon = getSupabaseAnon(token);
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const redirectUri = `${getAppUrl()}/api/crm/callback`;

    const { data: conn, error: connError } = await supabase
      .from('crm_connections')
      .select('id, access_token_encrypted, refresh_token_encrypted, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'hubspot')
      .single();

    if (connError || !conn) {
      return NextResponse.json(
        { error: 'No HubSpot connection. Connect HubSpot in Settings → Integrations first.' },
        { status: 400 }
      );
    }

    let accessToken = conn.access_token_encrypted as string;
    const refreshToken = conn.refresh_token_encrypted as string;
    const expiresAt = conn.expires_at ? new Date(conn.expires_at).getTime() : 0;

    if (Date.now() >= expiresAt - 60 * 1000) {
      const refreshed = await refreshHubSpotToken(refreshToken, redirectUri);
      accessToken = refreshed.accessToken;
      const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000).toISOString();
      await supabase
        .from('crm_connections')
        .update({
          access_token_encrypted: refreshed.accessToken,
          refresh_token_encrypted: refreshed.refreshToken,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conn.id);
    }

    const { data: savedContacts } = await supabase
      .from('user_contacts')
      .select('id, contact_user_id, display_name, met_at_location, met_at, how_met, notes')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    const { data: scannedContacts } = await supabase
      .from('scanned_contacts')
      .select('id, name, title, company, email, phone, website, linkedin')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email, phone, title, website')
      .in(
        'user_id',
        (savedContacts ?? []).map((c) => c.contact_user_id)
      );

    const profileByUserId = new Map(
      (profiles ?? []).map((p) => [p.user_id, p])
    );

    const result: SyncResult = { success: true, created: 0, skipped: 0, failed: 0 };
    const seenEmails = new Set<string>();

    for (const c of savedContacts ?? []) {
      const profile = profileByUserId.get(c.contact_user_id);
      const input = mapSavedContactToHubSpot(
        c.display_name || '',
        profile
          ? {
              email: profile.email,
              phone: profile.phone,
              title: profile.title,
              website: profile.website,
            }
          : null
      );
      if (!input) {
        result.skipped++;
        continue;
      }
      const email = input.email?.toLowerCase();
      if (email && seenEmails.has(email)) {
        result.skipped++;
        continue;
      }
      if (email) seenEmails.add(email);

      try {
        if (email) {
          const existing = await searchHubSpotContactByEmail(accessToken, email);
          if (existing) {
            result.skipped++;
            continue;
          }
        }
        await createHubSpotContact(accessToken, input);
        result.created++;
      } catch {
        result.failed++;
      }
    }

    for (const s of scannedContacts ?? []) {
      const input = mapScannedContactToHubSpot({
        name: s.name,
        title: s.title,
        company: s.company,
        email: s.email,
        phone: s.phone,
        website: s.website,
        linkedin: s.linkedin,
      });
      if (!input) {
        result.skipped++;
        continue;
      }
      const email = input.email?.toLowerCase();
      if (email && seenEmails.has(email)) {
        result.skipped++;
        continue;
      }
      if (email) seenEmails.add(email);

      try {
        if (email) {
          const existing = await searchHubSpotContactByEmail(accessToken, email);
          if (existing) {
            result.skipped++;
            continue;
          }
        }
        await createHubSpotContact(accessToken, input);
        result.created++;
      } catch {
        result.failed++;
      }
    }

    await supabase
      .from('crm_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conn.id);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `CRM sync error: ${message}`, success: false, created: 0, skipped: 0, failed: 0 },
      { status: 500 }
    );
  }
}
