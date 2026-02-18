/**
 * Sync appointments from Calendly API to appointments table
 * - Fetches scheduled_events from Calendly
 * - Upserts into appointments (catches events missed by webhook)
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendlyEvent {
  uri: string;
  start_time: string;
  end_time: string;
  status?: string;
  event_type: string;
}

interface CalendlyInvitee {
  uri: string;
  email?: string;
  name?: string;
}

export async function POST(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization' }), {
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
      .select('access_token, calendly_user_uri, calendly_organization, scheduling_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!cu?.access_token) {
      return new Response(JSON.stringify({ error: 'Calendly not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const needsProfile = !cu.calendly_user_uri && !cu.calendly_organization;
    const needsSchedulingUrl = !cu.scheduling_url;
    if (needsProfile || needsSchedulingUrl) {
      const meRes = await fetch('https://api.calendly.com/users/me', {
        headers: { Authorization: `Bearer ${cu.access_token}` },
      });
      if (!meRes.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch Calendly user' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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

    const userUri = cu.calendly_user_uri;
    const orgUri = cu.calendly_organization;
    if (!userUri && !orgUri) {
      return new Response(JSON.stringify({ error: 'Missing Calendly user/org URI' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const minStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const maxStart = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const params = new URLSearchParams({
      status: 'active',
      min_start_time: minStart,
      max_start_time: maxStart,
    });
    if (userUri) params.set('user', userUri);
    else if (orgUri) params.set('organization', orgUri);

    const eventsRes = await fetch(
      `https://api.calendly.com/scheduled_events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${cu.access_token}` } }
    );

    if (!eventsRes.ok) {
      const text = await eventsRes.text();
      console.error('Calendly scheduled_events failed', eventsRes.status, text);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Calendly events', details: text }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const eventsData = await eventsRes.json();
    const events: CalendlyEvent[] = eventsData.collection ?? [];

    let synced = 0;
    for (const ev of events) {
      const eventUri = ev.uri;
      const eventType = ev.event_type ?? '';

      let inviteeEmail: string | null = null;
      let inviteeName: string | null = null;

      const eventUuid = eventUri.split('/').pop() ?? '';
      const invRes = await fetch(
        `https://api.calendly.com/scheduled_events/${eventUuid}/invitees`,
        { headers: { Authorization: `Bearer ${cu.access_token}` } }
      );
      if (invRes.ok) {
        const invData = await invRes.json();
        const invitees: CalendlyInvitee[] = invData.collection ?? [];
        const first = invitees[0];
        if (first) {
          inviteeEmail = first.email ?? null;
          inviteeName = first.name ?? null;
        }
      }

      const { error } = await supabase.from('appointments').upsert(
        {
          user_id: user.id,
          event_uri: eventUri,
          event_type: eventType,
          invitee_email: inviteeEmail,
          invitee_name: inviteeName,
          start_time: ev.start_time,
          end_time: ev.end_time,
          status: ev.status === 'canceled' ? 'canceled' : 'booked',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'event_uri' }
      );
      if (!error) synced++;
    }

    return new Response(
      JSON.stringify({ ok: true, synced, count: events.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('calendly-sync', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
