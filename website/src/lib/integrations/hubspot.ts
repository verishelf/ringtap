/**
 * HubSpot CRM integration client.
 * OAuth: https://app.hubspot.com/oauth/authorize (or app-na2.hubspot.com for NA2 accounts)
 * Token: https://api.hubapi.com/oauth/v1/token
 * Contacts: https://api.hubapi.com/crm/v3/objects/contacts
 */

const HUBSPOT_AUTH_URL =
  process.env.HUBSPOT_AUTH_URL?.trim() || 'https://app.hubspot.com/oauth/authorize';
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';
const HUBSPOT_CONTACTS_URL = 'https://api.hubapi.com/crm/v3/objects/contacts';
const HUBSPOT_SCOPES = 'crm.objects.contacts.read crm.objects.contacts.write';

export type HubSpotContactInput = {
  email?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  jobtitle?: string;
  company?: string;
  website?: string;
};

export function getHubSpotAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.HUBSPOT_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error('HUBSPOT_CLIENT_ID is not configured');
  }
  const params = new URLSearchParams({
    client_id: clientId,
    scope: HUBSPOT_SCOPES,
    redirect_uri: redirectUri,
    state,
  });
  return `${HUBSPOT_AUTH_URL}?${params.toString()}`;
}

export async function exchangeHubSpotCode(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const clientId = process.env.HUBSPOT_CLIENT_ID?.trim();
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error('HubSpot OAuth credentials not configured');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HubSpot token exchange failed: ${err}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 1800,
  };
}

export async function refreshHubSpotToken(
  refreshToken: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const clientId = process.env.HUBSPOT_CLIENT_ID?.trim();
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error('HubSpot OAuth credentials not configured');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    refresh_token: refreshToken,
  });

  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HubSpot token refresh failed: ${err}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresIn: data.expires_in ?? 1800,
  };
}

export async function createHubSpotContact(
  accessToken: string,
  contact: HubSpotContactInput
): Promise<{ id: string }> {
  const properties: Record<string, string> = {};
  if (contact.email) properties.email = contact.email;
  if (contact.firstname) properties.firstname = contact.firstname;
  if (contact.lastname) properties.lastname = contact.lastname;
  if (contact.phone) properties.phone = contact.phone;
  if (contact.jobtitle) properties.jobtitle = contact.jobtitle;
  if (contact.company) properties.company = contact.company;
  if (contact.website) properties.website = contact.website;

  if (Object.keys(properties).length === 0) {
    throw new Error('At least one contact property is required');
  }
  if (!properties.email && !properties.firstname && !properties.lastname) {
    throw new Error('HubSpot requires at least email, firstname, or lastname');
  }

  const res = await fetch(HUBSPOT_CONTACTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HubSpot create contact failed: ${err}`);
  }

  const data = (await res.json()) as { id: string };
  return { id: data.id };
}

export async function searchHubSpotContactByEmail(
  accessToken: string,
  email: string
): Promise<{ id: string } | null> {
  if (!email?.trim()) return null;
  const searchUrl = 'https://api.hubapi.com/crm/v3/objects/contacts/search';
  const res = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ',
              value: email,
            },
          ],
        },
      ],
      properties: ['email'],
      limit: 1,
    }),
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as { results?: { id: string }[] };
  const first = data.results?.[0];
  return first ? { id: first.id } : null;
}
