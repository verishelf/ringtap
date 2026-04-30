import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-internal-push-secret',
};

const ANDROID_CONTACTS_CHANNEL = 'contacts';

type InternalPayload = {
  mode: 'internal';
  recipient_user_id: string;
  title: string;
  body: string;
  data: Record<string, string>;
};

type UserPayload = {
  recipient_user_id: string;
  from_user_id: string;
};

function wantsContactNotifications(
  row: { new_contacts: boolean } | null
): boolean {
  if (row == null) return true;
  return row.new_contacts === true;
}

export async function POST(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const internalSecret = Deno.env.get('INTERNAL_PUSH_SECRET')?.trim();
    const headerSecret = req.headers.get('x-internal-push-secret')?.trim();
    const isInternal = Boolean(internalSecret && headerSecret && headerSecret === internalSecret);

    const raw = await req.json().catch(() => ({}));

    if (isInternal) {
      const body = raw as InternalPayload;
      if (body?.mode !== 'internal' || !body.recipient_user_id || !body.title || body.body == null) {
        return new Response(
          JSON.stringify({ error: 'Invalid internal payload' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return sendToRecipient(
        supabase,
        body.recipient_user_id,
        body.title,
        typeof body.body === 'string' ? body.body : String(body.body),
        stringifyDataValues(body.data ?? {})
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = raw as UserPayload;
    const { recipient_user_id, from_user_id } = payload;
    if (!recipient_user_id || !from_user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing recipient_user_id or from_user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      data: { user: sender },
      error: authError,
    } = await supabase.auth.getUser(authHeader.slice(7));
    if (authError || !sender) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (sender.id !== from_user_id) {
      return new Response(JSON.stringify({ error: 'from_user_id must match caller' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (sender.id === recipient_user_id) {
      return new Response(JSON.stringify({ error: 'Invalid recipient' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: fromProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', from_user_id)
      .maybeSingle();
    const fromName = (fromProfile?.name as string | undefined)?.trim() || 'Someone';
    const title = 'New contact';
    const bodyText = `${fromName} added you to their contacts`;
    return sendToRecipient(supabase, recipient_user_id, title, bodyText, {
      type: 'contact',
      kind: 'added_you',
      fromUserId: from_user_id,
    });
  } catch (e) {
    console.error('send-contact-push', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function stringifyDataValues(data: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v == null) continue;
    out[k] = typeof v === 'string' ? v : String(v);
  }
  return out;
}

async function sendToRecipient(
  supabase: ReturnType<typeof createClient>,
  recipientUserId: string,
  title: string,
  body: string,
  data: Record<string, string>
) {
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('new_contacts')
    .eq('user_id', recipientUserId)
    .maybeSingle();
  if (!wantsContactNotifications(settings as { new_contacts: boolean } | null)) {
    return new Response(JSON.stringify({ ok: true, sent: 0, skipped: 'settings' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: rows } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', recipientUserId);
  const tokens = (rows ?? []).map((r) => r.token as string).filter(Boolean);
  if (tokens.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const bodyTruncated =
    typeof body === 'string' && body.length > 200 ? body.slice(0, 197) + '...' : body;
  const dataPayload = { ...data, type: data.type ?? 'contact' };
  const messages = tokens.map((token) => ({
    to: token,
    title,
    body: bodyTruncated,
    data: dataPayload,
    sound: 'default' as const,
    channelId: ANDROID_CONTACTS_CHANNEL,
  }));

  const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!expoRes.ok) {
    const text = await expoRes.text();
    console.error('Expo push error', expoRes.status, text);
    return new Response(JSON.stringify({ error: 'Push delivery failed' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, sent: messages.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
