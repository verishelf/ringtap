/**
 * Proxy to Calendly API for event types / booking links
 * - Authenticates RingTap user
 * - Fetches event types using stored OAuth token
 * - Returns scheduling URLs
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function GET(req: Request) {
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

    const { data: cu } = await supabase
      .from('calendly_users')
      .select('access_token, calendly_user_uri')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!cu?.access_token || !cu.calendly_user_uri) {
      return new Response(JSON.stringify({ error: 'Calendly not connected', links: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(
      `https://api.calendly.com/event_types?user=${encodeURIComponent(cu.calendly_user_uri)}`,
      {
        headers: { Authorization: `Bearer ${cu.access_token}` },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('Calendly event types failed', res.status, text);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch event types', links: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const json = await res.json();
    const collection = json.collection ?? [];
    const links = collection.map((item: { resource?: { name?: string; scheduling_url?: string; uri?: string }; name?: string; scheduling_url?: string; uri?: string }) => {
      const r = item.resource ?? item;
      return {
        name: r.name ?? 'Meeting',
        url: r.scheduling_url ?? '',
        uri: r.uri ?? '',
      };
    });

    return new Response(JSON.stringify({ links }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('calendly-links', e);
    return new Response(JSON.stringify({ error: 'Internal error', links: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
