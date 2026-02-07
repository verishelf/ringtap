import { supabase } from '@/lib/supabase/supabaseClient';
import type { AnalyticsSummary, ProfileTheme, ScannedContact, ScannedContactSource, UserLink, UserProfile } from '@/lib/supabase/types';
import { FREE_PLAN_MAX_LINKS } from '@/lib/supabase/types';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

const PROFILE_URL_BASE = 'https://ringtap.me';
const RING_API_BASE = 'https://www.ringtap.me';

// --- In-app saved contacts (user_contacts) ---
export type SavedContact = {
  id: string;
  contactUserId: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
};

export function getProfileUrl(username: string): string {
  return `${PROFILE_URL_BASE}/${username}`;
}

/** URL for NFC tap tracking — use when writing to NFC tag */
export function getProfileUrlNfc(username: string): string {
  return `${PROFILE_URL_BASE}/nfc/${username}`;
}

/** URL for QR scan tracking — use for QR code value */
export function getProfileUrlQr(username: string): string {
  return `${PROFILE_URL_BASE}/qr/${username}`;
}

// --- Ring (NFC activation) — calls Next.js API ---
export type RingStatus = {
  status: 'unclaimed' | 'claimed';
  chip_uid: string;
  ring_model: string;
  model_url: string | null;
  owner_user_id: string | null;
};

export async function getRingStatus(chipUid: string): Promise<RingStatus | null> {
  try {
    const res = await fetch(`${RING_API_BASE}/api/ring/status?uid=${encodeURIComponent(chipUid.trim())}`);
    if (!res.ok) return null;
    return (await res.json()) as RingStatus;
  } catch {
    return null;
  }
}

export async function claimRing(chipUid: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${RING_API_BASE}/api/ring/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: chipUid.trim(), user_id: userId }),
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!res.ok) return { success: false, error: data.error ?? 'Claim failed' };
    return { success: data.success ?? true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Claim failed' };
  }
}

/** First-tap flow: create a new ring and assign to user (no ring ID in URL). Returns chip_uid. */
export async function createAndClaimRing(userId: string): Promise<{ success: boolean; chip_uid?: string; already_linked?: boolean; error?: string }> {
  try {
    const res = await fetch(`${RING_API_BASE}/api/ring/create-and-claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = (await res.json()) as { success?: boolean; chip_uid?: string; already_linked?: boolean; error?: string };
    if (!res.ok) return { success: false, error: data.error ?? 'Failed to link ring' };
    return { success: true, chip_uid: data.chip_uid, already_linked: data.already_linked };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to link ring' };
  }
}

/** Unlink all rings owned by the current user (RLS: user can update own rings). */
export async function unlinkMyRings(): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Sign in to manage your ring' };
  const { error } = await supabase
    .from('rings')
    .update({ owner_user_id: null, status: 'unclaimed', updated_at: new Date().toISOString() })
    .eq('owner_user_id', user.id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// --- Profile ---
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return mapProfileFromDb(data);
}

export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error || !data) return null;
  return mapProfileFromDb(data);
}

export async function getSavedContacts(): Promise<SavedContact[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('user_contacts')
    .select('id, contact_user_id, display_name, avatar_url, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    contactUserId: row.contact_user_id as string,
    displayName: (row.display_name as string) ?? '',
    avatarUrl: resolveStorageUrlIfPath((row.avatar_url as string) ?? null),
    createdAt: row.created_at as string,
  }));
}

export async function deleteSavedContact(contactId: string): Promise<boolean> {
  const { error } = await supabase.from('user_contacts').delete().eq('id', contactId);
  return !error;
}

/** Save a contact using the app's Supabase client (no website API needed). RLS allows insert when owner_id = auth.uid(). */
export async function saveContact(
  contactUserId: string,
  displayName?: string,
  avatarUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Sign in to save contacts' };
  const { error } = await supabase.from('user_contacts').insert({
    owner_id: user.id,
    contact_user_id: contactUserId,
    display_name: (displayName ?? '').trim(),
    avatar_url: (avatarUrl ?? '').trim() || null,
  });
  if (error) {
    if (error.code === '23505') return { success: true }; // already saved
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Call Next.js save-contact API (used when saving from web). App uses saveContact() instead. */
export async function saveContactViaApi(
  accessToken: string,
  contactUserId: string,
  displayName?: string,
  avatarUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${RING_API_BASE}/api/save-contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        contact_user_id: contactUserId,
        display_name: displayName ?? '',
        avatar_url: avatarUrl ?? null,
      }),
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!res.ok) return { success: false, error: data.error ?? 'Failed to save contact' };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to save contact' };
  }
}

/** Call Next.js ring setup API (QR flow): link ring to current user. */
export async function setupRingViaApi(
  accessToken: string,
  setupId: string
): Promise<{ success: boolean; already_linked?: boolean; error?: string }> {
  try {
    const res = await fetch(`${RING_API_BASE}/api/ring/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ setup_id: setupId }),
    });
    const data = (await res.json()) as { success?: boolean; already_linked?: boolean; error?: string };
    if (!res.ok) return { success: false, error: data.error ?? 'Failed to link ring' };
    return { success: true, already_linked: data.already_linked };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to link ring' };
  }
}

export async function upsertProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<UserProfile | null> {
  const payload = {
    user_id: userId,
    username: (updates.username ?? '').toLowerCase(),
    name: updates.name ?? '',
    title: updates.title ?? '',
    bio: updates.bio ?? '',
    avatar_url: updates.avatarUrl ?? null,
    video_intro_url: updates.videoIntroUrl ?? null,
    email: updates.email ?? '',
    phone: updates.phone ?? '',
    website: updates.website ?? '',
    theme: updates.theme ?? defaultTheme(),
    custom_buttons: updates.customButtons ?? [],
    social_links: updates.socialLinks ?? {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload as never, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return null;
  return mapProfileFromDb(data);
}

function defaultTheme(): ProfileTheme {
  return {
    accentColor: '#0a7ea4',
    backgroundGradient: ['#1a1a2e', '#16213e'],
    buttonShape: 'rounded',
    typography: 'sans',
  };
}

function resolveStorageUrlIfPath(url: string | null): string | null {
  if (!url || !url.trim()) return null;
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('avatars/') || u.startsWith('intros/')) {
    const { data } = supabase.storage.from('profiles').getPublicUrl(u);
    return data?.publicUrl ?? u;
  }
  return u;
}

function mapProfileFromDb(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    username: row.username as string,
    name: row.name as string,
    title: row.title as string,
    bio: row.bio as string,
    avatarUrl: resolveStorageUrlIfPath((row.avatar_url as string) ?? null),
    videoIntroUrl: resolveStorageUrlIfPath((row.video_intro_url as string) ?? null),
    email: row.email as string,
    phone: row.phone as string,
    website: row.website as string,
    theme: (row.theme as ProfileTheme) ?? defaultTheme(),
    customButtons: (row.custom_buttons as UserProfile['customButtons']) ?? [],
    socialLinks: (row.social_links as UserProfile['socialLinks']) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// --- Links ---
export async function getLinks(userId: string): Promise<UserLink[]> {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) return [];
  return (data ?? []).map(mapLinkFromDb);
}

export async function createLink(
  userId: string,
  link: Omit<UserLink, 'id' | 'userId' | 'createdAt'>
): Promise<UserLink | null> {
  const { data, error } = await supabase.from('links').insert({
    user_id: userId,
    type: link.type,
    title: link.title,
    url: link.url,
    platform: link.platform ?? null,
    sort_order: link.sortOrder,
  })
    .select()
    .single();

  if (error) return null;
  return mapLinkFromDb(data);
}

export async function updateLink(id: string, updates: Partial<UserLink>): Promise<UserLink | null> {
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.url !== undefined) payload.url = updates.url;
  if (updates.platform !== undefined) payload.platform = updates.platform;
  if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;

  const { data, error } = await supabase
    .from('links')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) return null;
  return mapLinkFromDb(data);
}

export async function deleteLink(id: string): Promise<boolean> {
  const { error } = await supabase.from('links').delete().eq('id', id);
  return !error;
}

export function canAddLink(plan: string, currentCount: number): boolean {
  if (plan === 'pro') return true;
  return currentCount < FREE_PLAN_MAX_LINKS;
}

// --- Scanned contacts ---
export async function getScannedContacts(userId: string): Promise<ScannedContact[]> {
  const { data, error } = await supabase
    .from('scanned_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []).map(mapScannedContactFromDb);
}

export async function createScannedContact(
  userId: string,
  contact: Omit<ScannedContact, 'id' | 'userId' | 'createdAt'>
): Promise<ScannedContact | null> {
  const { data, error } = await supabase
    .from('scanned_contacts')
    .insert({
      user_id: userId,
      name: contact.name ?? '',
      title: contact.title ?? '',
      company: contact.company ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      website: contact.website ?? '',
      avatar_url: contact.avatarUrl ?? null,
      profile_url: contact.profileUrl ?? null,
      source: contact.source ?? 'manual',
    })
    .select()
    .single();

  if (error) return null;
  return mapScannedContactFromDb(data);
}

export async function deleteScannedContact(id: string): Promise<boolean> {
  const { error } = await supabase.from('scanned_contacts').delete().eq('id', id);
  return !error;
}

function mapScannedContactFromDb(row: Record<string, unknown>): ScannedContact {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: (row.name as string) ?? '',
    title: (row.title as string) ?? '',
    company: (row.company as string) ?? '',
    email: (row.email as string) ?? '',
    phone: (row.phone as string) ?? '',
    website: (row.website as string) ?? '',
    avatarUrl: resolveStorageUrlIfPath((row.avatar_url as string) ?? null),
    profileUrl: (row.profile_url as string) ?? null,
    source: (row.source as ScannedContactSource) ?? 'manual',
    createdAt: row.created_at as string,
  };
}

function mapLinkFromDb(row: Record<string, unknown>): UserLink {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as UserLink['type'],
    title: row.title as string,
    url: row.url as string,
    platform: (row.platform as UserLink['platform']) ?? undefined,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
  };
}

// --- Analytics ---
export async function recordEvent(
  profileId: string,
  type: 'profile_view' | 'link_click' | 'nfc_tap' | 'qr_scan',
  linkId?: string
): Promise<void> {
  await supabase.from('analytics_events').insert({
    profile_id: profileId,
    type,
    link_id: linkId ?? null,
  });
}

export async function getAnalytics(
  profileId: string,
  days: 7 | 30 | 90
): Promise<AnalyticsSummary> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const { data: rawEvents, error } = await supabase
    .from('analytics_events')
    .select('type, created_at')
    .eq('profile_id', profileId)
    .gte('created_at', fromDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to load analytics');
  }

  const events = (rawEvents ?? []) as Array<{ type: string; created_at: string }>;
  const profileViewCount = events.filter((e) => e.type === 'profile_view').length;
  const nfcTapCount = events.filter((e) => e.type === 'nfc_tap').length;
  const qrScanCount = events.filter((e) => e.type === 'qr_scan').length;
  const profileViews = profileViewCount + nfcTapCount + qrScanCount;
  const linkClicks = events.filter((e) => e.type === 'link_click').length;
  const nfcTaps = nfcTapCount;
  const qrScans = qrScanCount;

  const byDay: AnalyticsSummary['byDay'] = [];
  const dayMap = new Map<string, { profile_view: number; link_click: number; nfc_tap: number; qr_scan: number }>();
  for (let d = 0; d < days; d++) {
    const dte = new Date(fromDate);
    dte.setDate(dte.getDate() + d);
    const key = dte.toISOString().slice(0, 10);
    dayMap.set(key, { profile_view: 0, link_click: 0, nfc_tap: 0, qr_scan: 0 });
  }
  for (const e of events ?? []) {
    const key = (e.created_at as string).slice(0, 10);
    const entry = dayMap.get(key);
    if (entry && e.type in entry) {
      (entry as Record<string, number>)[e.type as string]++;
    }
  }
  dayMap.forEach((counts, date) => {
    Object.entries(counts).forEach(([type, count]) => {
      if (count > 0) byDay.push({ date, count, type });
    });
  });
  byDay.sort((a, b) => a.date.localeCompare(b.date));

  return { profileViews, linkClicks, nfcTaps, qrScans, byDay };
}

// --- Subscription ---
export async function getSubscription(userId: string): Promise<{ plan: string; status: string | null } | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  const row = data as { plan: string; status: string | null };
  return { plan: row.plan, status: row.status };
}

// --- Storage (avatars, video) ---
/** Read file as ArrayBuffer. Uses FileSystem + base64 for file:// (RN/Expo Go); fetch only for remote URIs. */
async function readFileAsArrayBuffer(uri: string, defaultMime = 'image/jpeg'): Promise<{ data: ArrayBuffer; mimeType: string }> {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'mp4' || ext === 'mov' ? 'video/mp4' : defaultMime;

  if (uri.startsWith('file://')) {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const data = decodeBase64(base64);
    return { data, mimeType };
  }

  const data = await new Promise<ArrayBuffer>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', uri, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
      else reject(new Error(`HTTP ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send();
  });
  return { data, mimeType };
}

export type UploadResult = { url: string | null; error?: string };

export async function uploadAvatar(userId: string, uri: string): Promise<UploadResult> {
  const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const path = `avatars/${userId}/${Date.now()}.${ext}`;
  try {
    const { data, mimeType } = await readFileAsArrayBuffer(uri);
    const { error: uploadError } = await supabase.storage.from('profiles').upload(path, data, {
      contentType: mimeType,
      upsert: true,
    });
    if (uploadError) {
      return { url: null, error: uploadError.message };
    }
    const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(path);
    return { url: urlData?.publicUrl ?? null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { url: null, error: message };
  }
}

export async function uploadVideoIntro(userId: string, uri: string): Promise<UploadResult> {
  const ext = uri.split('.').pop()?.split('?')[0] ?? 'mp4';
  const path = `intros/${userId}/${Date.now()}.${ext}`;
  try {
    const { data, mimeType } = await readFileAsArrayBuffer(uri, 'video/mp4');
    const { error: uploadError } = await supabase.storage.from('profiles').upload(path, data, {
      contentType: ext === 'mov' ? 'video/quicktime' : mimeType,
      upsert: true,
    });
    if (uploadError) {
      return { url: null, error: uploadError.message };
    }
    const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(path);
    return { url: urlData?.publicUrl ?? null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { url: null, error: message };
  }
}
