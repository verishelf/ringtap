/**
 * Shared CRM config for OAuth redirect URI.
 * Must match exactly what's registered in HubSpot app settings.
 */
export function getRedirectUri(): string {
  const explicit = process.env.HUBSPOT_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const url = (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .trim();
  const base = url.startsWith('http') ? url : `https://${url}`;
  return `${base}/api/crm/callback`;
}

export function getAppUrl(): string {
  const url = (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .trim();
  return url.startsWith('http') ? url : `https://${url}`;
}
