/**
 * Calendly OAuth callback handler (fixed)
 * - Includes debug mode
 * - Uses serve()
 * - Prevents hangs
 * - Validates env vars before doing anything
 */

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- UTILITIES ---------- //

function env(key: string) {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing env variable: ${key}`);
  return value;
}

// ---------- TOKEN HANDLERS ---------- //

async function fetchTokens(code: string) {
  const clientId = env("CALENDLY_CLIENT_ID");
  const clientSecret = env("CALENDLY_CLIENT_SECRET");
  const redirectUri = env("CALENDLY_REDIRECT_URI");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://auth.calendly.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${txt}`);
  }

  return await res.json();
}

async function fetchCalendlyUser(accessToken: string) {
  const res = await fetch("https://api.calendly.com/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Calendly user fetch failed: ${res.status} ${txt}`);
  }

  return await res.json();
}

// ---------- MAIN FUNCTION ---------- //

serve(async (req) => {
  const url = new URL(req.url);

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ---------- DEBUG MODE ---------- //
  if (url.searchParams.get("debug") === "1") {
    try {
      const client = Deno.env.get("CALENDLY_CLIENT_ID");
      const secret = Deno.env.get("CALENDLY_CLIENT_SECRET");
      const redirect = Deno.env.get("CALENDLY_REDIRECT_URI");
      const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      return new Response(
        JSON.stringify({
          calendly_client_id_present: !!client,
          calendly_client_secret_present: !!secret,
          calendly_redirect_present: !!redirect,
          service_role_present: !!service,
          message: "Debug mode active",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      return new Response(`Debug error: ${e.message}`, { status: 500 });
    }
  }

  // ---------- NORMAL OAUTH FLOW ---------- //

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Redirect on missing params
  if (!code || !state) {
    return Response.redirect(
      "https://www.ringtap.me/oauth/calendly?status=error&error=missing_params",
      302
    );
  }

  try {
    const tokens = await fetchTokens(code);
    const calendlyUser = await fetchCalendlyUser(tokens.access_token);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const supabaseUrl = env("SUPABASE_URL");
    const serviceRole = env("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRole);

    const { error } = await supabase.from("calendly_users").upsert(
      {
        user_id: state,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || "Bearer",
        expires_at: expiresAt.toISOString(),
        calendly_user_uri: calendlyUser.resource.uri,
        calendly_organization: calendlyUser.resource.current_organization,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      throw new Error("DB insert failed: " + error.message);
    }

    return Response.redirect(
      "https://www.ringtap.me/oauth/calendly?status=success",
      302
    );
  } catch (e) {
    console.error("OAuth error:", e);
    const err = encodeURIComponent(e.message);
    return Response.redirect(
      `https://www.ringtap.me/oauth/calendly?status=error&error=${err}`,
      302
    );
  }
});