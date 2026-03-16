import { NextResponse } from 'next/server';
import { getRedirectUri } from '@/lib/crmConfig';

/**
 * Debug endpoint: returns the redirect URI used for HubSpot OAuth.
 * Open this in a browser to verify it matches what's in your HubSpot app.
 * Example: https://www.ringtap.me/api/crm/config
 */
export async function GET() {
  const redirectUri = getRedirectUri();
  const authUrlBase = process.env.HUBSPOT_AUTH_URL?.trim() || 'https://app.hubspot.com/oauth/authorize';
  return NextResponse.json({
    redirect_uri: redirectUri,
    auth_url_base: authUrlBase,
    hint: 'Add redirect_uri exactly to HubSpot: Legacy app → Auth → Redirect URLs',
  });
}
