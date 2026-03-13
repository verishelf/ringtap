/**
 * Contact service for business card scanner.
 * Saves scanned contacts to Supabase scanned_contacts table.
 */

import { supabase } from '@/lib/supabase/supabaseClient';
import type { ParsedContact } from './ocrService';

export type ScannedContactRecord = {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  source: 'camera';
  createdAt: string;
};

export async function saveScannedContact(
  userId: string,
  contact: ParsedContact & { title?: string; website?: string }
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return { success: false, error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('scanned_contacts')
    .insert({
      user_id: userId,
      name: (contact.name ?? '').trim(),
      title: (contact.title ?? '').trim(),
      company: (contact.company ?? '').trim(),
      email: (contact.email ?? '').trim(),
      phone: (contact.phone ?? '').trim(),
      website: (contact.website ?? '').trim(),
      source: 'camera',
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, id: data?.id };
}

export async function sendInviteToRingTap(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('https://www.ringtap.me/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = (await res.json()) as { success?: boolean; error?: string };
    if (!res.ok) return { success: false, error: json.error ?? 'Failed to send invite' };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to send invite' };
  }
}
