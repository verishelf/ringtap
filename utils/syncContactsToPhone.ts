/**
 * Sync saved RingTap contacts to the device's native phone contacts.
 */

import * as Contacts from 'expo-contacts';
import type { SavedContact } from '@/lib/api';
import { getProfile } from '@/lib/api';

const PROFILE_URL_BASE = 'https://www.ringtap.me';

function parseDisplayName(displayName: string): { firstName: string; lastName: string } {
  const trimmed = (displayName || '').trim() || 'Contact';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const lastName = parts.pop() ?? '';
  const firstName = parts.join(' ');
  return { firstName, lastName };
}

export type SyncResult = {
  success: boolean;
  added: number;
  skipped: number;
  failed: number;
  error?: string;
};

export async function syncContactsToPhone(
  contacts: SavedContact[],
  options?: { fetchProfileForEmailPhone?: boolean }
): Promise<SyncResult> {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') {
    return {
      success: false,
      added: 0,
      skipped: 0,
      failed: contacts.length,
      error: 'Contacts permission denied',
    };
  }

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const c of contacts) {
    try {
      const { firstName, lastName } = parseDisplayName(c.displayName);
      let email: string | undefined;
      let phone: string | undefined;

      if (options?.fetchProfileForEmailPhone) {
        try {
          const profile = await getProfile(c.contactUserId);
          if (profile?.email?.trim()) email = profile.email.trim();
          if (profile?.phone?.trim()) phone = profile.phone.trim();
        } catch {
          // Use whatever we have
        }
      }

      const profileUrl = `${PROFILE_URL_BASE}/profile/${c.contactUserId}`;

      const contact: Contacts.Contact = {
        contactType: Contacts.ContactTypes.Person,
        firstName,
        lastName: lastName || undefined,
        urlAddresses: [{ label: 'RingTap', url: profileUrl }],
      };
      if (email) {
        contact.emails = [{ label: 'work', email }];
      }
      if (phone) {
        contact.phoneNumbers = [{ label: 'mobile', number: phone }];
      }

      const contactId = await Contacts.addContactAsync(contact);
      if (contactId && contactId.length > 0) {
        added++;
      } else {
        skipped++;
      }
    } catch {
      failed++;
    }
  }

  return {
    success: failed === 0,
    added,
    skipped,
    failed,
  };
}
