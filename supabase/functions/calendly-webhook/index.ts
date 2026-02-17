/**
 * Calendly webhook receiver
 * - Handles invitee.created and invitee.canceled
 * - user_id passed in callback URL query (?user_id=xxx) when registering webhook
 * - Inserts/updates appointments table
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event: 'invitee.created' | 'invitee.canceled';
  payload: {
    uri: string;
    event?: string;
    canceled?: boolean;
    rescheduled?: boolean;
  };
}

async function fetchInviteeDetails(
  uri: string,
  accessToken: string
): Promise<{
  email?: string;
  name?: string;
  eventUri: string;
  start_time: string;
  end_time: string;
}> {
  const res = await fetch(uri, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Invitee fetch failed: ${res.status}`);
  }

  const json = await res.json();
  const resource = json.resource ?? json;
  const eventUri = resource.event ?? '';

  let startTime = '';
  let endTime = '';
  if (eventUri) {
    const eventRes = await fetch(eventUri, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (eventRes.ok) {
      const eventJson = await eventRes.json();
      const ev = eventJson.resource ?? eventJson;
      startTime = ev.start_time ?? '';
      endTime = ev.end_time ?? '';
    }
  }

  return {
    email: resource.email,
    name: resource.name,
    eventUri,
    start_time: startTime || (resource.start_time ?? ''),
    end_time: endTime || (resource.end_time ?? ''),
  };
}

async function verifyWebhookSignature(body: string, signature: string | null, signingKey: string): Promise<boolean> {
  if (!signature || !signingKey) return true;
  try {
    const parts = signature.split(',');
    const ts = parts.find((p) => p.startsWith('t='))?.slice(2);
    const sig = parts.find((p) => p.startsWith('v1='))?.slice(3);
    if (!ts || !sig) return false;
    const payload = `${ts}.${body}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(signingKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const bytes = new Uint8Array(mac);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return sig === hex;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signingKey = Deno.env.get('CALENDLY_WEBHOOK_SIGNING_KEY');
    const signature = req.headers.get('Calendly-Webhook-Signature');
    if (signingKey && signature && !(await verifyWebhookSignature(body, signature, signingKey))) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(body) as WebhookPayload;
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user_id in callback URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { event: eventType, payload: p } = payload;

    if (!eventType || !p?.uri) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (eventType !== 'invitee.created' && eventType !== 'invitee.canceled') {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: cu } = await supabase
      .from('calendly_users')
      .select('access_token')
      .eq('user_id', userId)
      .maybeSingle();

    if (!cu?.access_token) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const details = await fetchInviteeDetails(p.uri, cu.access_token);
    const status = eventType === 'invitee.canceled' || p.canceled ? 'canceled' : 'booked';
    const finalStatus = p.rescheduled === true ? 'rescheduled' : status;

    await supabase.from('appointments').upsert(
      {
        user_id: userId,
        event_uri: p.uri,
        event_type: details.eventUri,
        invitee_email: details.email,
        invitee_name: details.name,
        start_time: details.start_time,
        end_time: details.end_time,
        status: finalStatus,
        raw_payload: payload,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'event_uri' }
    );

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('calendly-webhook', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
