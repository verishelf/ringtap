/**
 * Register Calendly webhook for a user after OAuth
 * - Called by app after successful OAuth
 * - POST to Calendly webhook_subscriptions
 * - Subscribes invitee.created + invitee.canceled
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.slice(7));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let { data: cu } = await supabase
      .from('calendly_users')
      .select('access_token, calendly_organization, calendly_user_uri, scheduling_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!cu?.access_token) {
      return new Response(JSON.stringify({ error: 'Calendly not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch profile if missing (OAuth stores tokens only; profile deferred to reduce WORKER_LIMIT)
    const needsProfile = !cu.calendly_organization && !cu.calendly_user_uri;
    const needsSchedulingUrl = !cu.scheduling_url;
    if (needsProfile || needsSchedulingUrl) {
      const meRes = await fetch('https://api.calendly.com/users/me', {
        headers: { Authorization: `Bearer ${cu.access_token}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        const uri = me.resource?.uri;
        const org = me.resource?.current_organization;
        const schedulingUrl = me.resource?.scheduling_url ?? null;
        if (uri || org || schedulingUrl) {
          await supabase
            .from('calendly_users')
            .update({
              calendly_user_uri: uri ?? null,
              calendly_organization: org ?? null,
              scheduling_url: schedulingUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
          cu = { ...cu, calendly_user_uri: uri, calendly_organization: org, scheduling_url: schedulingUrl };
        }
      }
    }

    const webhookUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/calendly-webhook?user_id=${user.id}`;

    const body: Record<string, unknown> = {
      url: webhookUrl,
      events: ['invitee.created', 'invitee.canceled'],
    };
    if (cu.calendly_organization) {
      body.scope = 'organization';
      body.organization = cu.calendly_organization;
    } else if (cu.calendly_user_uri) {
      body.scope = 'user';
      body.user = cu.calendly_user_uri;
    } else {
      return new Response(JSON.stringify({ error: 'Missing Calendly org/user URI' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.calendly.com/webhook_subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cu.access_token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Calendly webhook register failed', res.status, text);
      return new Response(
        JSON.stringify({ error: 'Failed to register webhook', details: text }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await res.json();
    return new Response(
      JSON.stringify({ ok: true, webhook_id: result.resource?.uri }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('calendly-register-webhook', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
