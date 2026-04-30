import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_PHONE = 40;
const MAX_COMPANY = 160;
const MAX_MESSAGE = 2000;

function getSupabaseAdmin() {
  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .trim();
  let supabaseUrl = rawUrl;
  if (supabaseUrl && !/^https?:\/\//i.test(supabaseUrl)) supabaseUrl = 'https://' + supabaseUrl;
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/^["']|["']$/g, '').trim();
  if (!supabaseUrl || !serviceKey) return { error: 'Server missing Supabase service configuration' as const, client: null };
  return { error: null as null, client: createClient(supabaseUrl, serviceKey) };
}

async function fireWebhook(
  url: string,
  payload: Record<string, unknown>
): Promise<void> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'RingTap-Lead-Webhook/1.0' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
  } catch {
    // best-effort
  } finally {
    clearTimeout(t);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: {
      username?: string;
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
      message?: string;
      source_path?: string;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const username = body.username?.trim().toLowerCase();
    const name = body.name?.trim() ?? '';
    const email = body.email?.trim() ?? '';
    if (!username) {
      return NextResponse.json({ error: 'Missing username' }, { status: 400 });
    }
    if (!name || name.length > MAX_NAME) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }
    if (!email || email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const phone = (body.phone ?? '').trim().slice(0, MAX_PHONE) || null;
    const company = (body.company ?? '').trim().slice(0, MAX_COMPANY) || null;
    const message = (body.message ?? '').trim().slice(0, MAX_MESSAGE) || null;
    const sourcePath = (body.source_path ?? '').trim().slice(0, 500) || null;

    const { client: supabase, error: cfgErr } = getSupabaseAdmin();
    if (cfgErr || !supabase) {
      return NextResponse.json({ error: cfgErr ?? 'Server configuration error' }, { status: 500 });
    }

    const pattern = username.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const { data: profileRow, error: profileErr } = await supabase
      .from('profiles')
      .select('id, user_id, username, name')
      .ilike('username', pattern)
      .maybeSingle();

    if (profileErr || !profileRow) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const userId = profileRow.user_id as string;
    const profileId = profileRow.id as string;

    let plan = 'free';
    const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', userId).maybeSingle();
    if (sub?.plan === 'pro') plan = 'pro';

    if (plan !== 'pro') {
      return NextResponse.json({ error: 'Lead capture is not available for this profile' }, { status: 403 });
    }

    const { data: leadSettings } = await supabase
      .from('profile_lead_settings')
      .select('enabled, headline, collect_company, collect_phone, collect_message, webhook_url')
      .eq('user_id', userId)
      .maybeSingle();

    if (!leadSettings?.enabled) {
      return NextResponse.json({ error: 'Lead form is not enabled' }, { status: 403 });
    }

    const collectCompany = leadSettings.collect_company !== false;
    const collectPhone = !!leadSettings.collect_phone;
    const collectMessage = leadSettings.collect_message !== false;

    if (collectCompany && !(company ?? '').trim()) {
      return NextResponse.json({ error: 'Company is required' }, { status: 400 });
    }
    if (collectPhone && !(phone ?? '').trim()) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }
    if (collectMessage && !(message ?? '').trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const metadata = {
      profile_username: profileRow.username,
      headline: leadSettings.headline,
    };

    const { error: insertErr } = await supabase.from('profile_lead_submissions').insert({
      profile_user_id: userId,
      name,
      email,
      phone: collectPhone ? phone : null,
      company: collectCompany ? company : null,
      message: collectMessage ? message : null,
      source_path: sourcePath,
      metadata,
    });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    await supabase.from('analytics_events').insert({
      profile_id: profileId,
      type: 'lead_form_submit',
      link_id: null,
      metadata: { source: 'profile_lead_form' },
    });

    const webhookUrl = (leadSettings.webhook_url as string | null)?.trim();
    if (webhookUrl && /^https:\/\//i.test(webhookUrl)) {
      void fireWebhook(webhookUrl, {
        event: 'ringtap.profile_lead',
        submitted_at: new Date().toISOString(),
        profile: {
          username: profileRow.username,
          name: profileRow.name,
          user_id: userId,
        },
        lead: { name, email, phone, company, message, source_path: sourcePath },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
