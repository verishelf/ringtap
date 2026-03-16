/**
 * CRM sync service - maps RingTap contacts to HubSpot format.
 * Used by the website API routes (server-side).
 */

import type { HubSpotContactInput } from '@/lib/integrations/hubspot';

function parseDisplayName(displayName: string): { firstname: string; lastname: string } {
  const trimmed = (displayName || '').trim() || 'Contact';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstname: parts[0], lastname: '' };
  }
  const last = parts.pop() ?? '';
  const first = parts.join(' ');
  return { firstname: first, lastname: last };
}

/**
 * Map a RingTap saved contact (user_contacts + profile) to HubSpot format.
 */
export function mapSavedContactToHubSpot(
  displayName: string,
  profile: { email?: string; phone?: string; title?: string; website?: string } | null
): HubSpotContactInput | null {
  const { firstname, lastname } = parseDisplayName(displayName);
  const email = profile?.email?.trim();
  const phone = profile?.phone?.trim();
  const jobtitle = profile?.title?.trim();
  const website = profile?.website?.trim();

  if (!email && !firstname && !lastname) {
    return null;
  }

  return {
    firstname: firstname || undefined,
    lastname: lastname || undefined,
    email: email || undefined,
    phone: phone || undefined,
    jobtitle: jobtitle || undefined,
    website: website || undefined,
  };
}

export type ScannedContactForSync = {
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
};

/**
 * Map a RingTap scanned contact to HubSpot format.
 */
export function mapScannedContactToHubSpot(scanned: ScannedContactForSync): HubSpotContactInput | null {
  const email = scanned.email?.trim();
  const { firstname, lastname } = parseDisplayName(scanned.name || email || 'Contact');

  if (!email && !firstname && !lastname) {
    return null;
  }

  return {
    email: email || undefined,
    firstname: firstname || undefined,
    lastname: lastname || undefined,
    phone: scanned.phone?.trim() || undefined,
    jobtitle: scanned.title?.trim() || undefined,
    company: scanned.company?.trim() || undefined,
    website: scanned.website?.trim() || undefined,
  };
}

export type SyncResult = {
  success: boolean;
  created: number;
  skipped: number;
  failed: number;
  error?: string;
};
