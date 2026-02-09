import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BodyPayload {
  recipient_user_id: string;
  body: string;
  conversation_id: string;
}

export async function POST(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as BodyPayload;
    const { recipient_user_id, body, conversation_id } = payload;
    if (!recipient_user_id || body == null || !conversation_id) {
      return new Response(JSON.stringify({ error: 'Missing recipient_user_id, body, or conversation_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

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

    const { data: conv } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversation_id)
      .maybeSingle();
    if (!conv || (conv.user1_id !== sender.id && conv.user2_id !== sender.id)) {
      return new Response(JSON.stringify({ error: 'Conversation not found or sender not a participant' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: rows } = await supabase.from('push_tokens').select('token').eq('user_id', recipient_user_id);
    const tokens = (rows ?? []).map((r) => r.token).filter(Boolean);
    if (tokens.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const title = 'New message';
    const bodyTruncated = typeof body === 'string' && body.length > 200 ? body.slice(0, 197) + '...' : body;
    const messages = tokens.map((token) => ({
      to: token,
      title,
      body: bodyTruncated,
      data: { conversationId: conversation_id },
      sound: 'default',
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
  } catch (e) {
    console.error('send-message-push', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
