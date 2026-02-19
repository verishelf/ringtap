import * as FileSystem from 'expo-file-system/legacy';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase/supabaseClient';
import type {
  AnalyticsSummary,
  ProfileTheme,
  ScannedContact,
  ScannedContactSource,
  UserLink,
  UserProfile,
} from '@/lib/supabase/types';
import { FREE_PLAN_MAX_LINKS } from '@/lib/supabase/types';

export type { UserProfile, UserLink };

const PROFILE_URL_BASE = 'https://ringtap.me';
const RING_API_BASE = 'https://www.ringtap.me';

// --- Types ---
export type SavedContact = {
  id: string;
  contactUserId: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
};

export type RingStatus = {
  status: 'unclaimed' | 'claimed';
  chip_uid: string;
  ring_model: string;
  model_url: string | null;
  owner_user_id: string | null;
};

export type Conversation = {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type ConversationWithPeer = {
  id: string;
  peerUserId: string;
  peerName: string;
  peerAvatarUrl: string | null;
  peerIsPro: boolean;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
  hasUnread: boolean;
};

// --- Helpers ---
function resolveStorageUrlIfPath(url: string | null): string | null {
  if (!url || !url.trim()) return null;
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  let path = u.replace(/^\/+/, '').replace(/^profiles\/+/, '');
  if (path.startsWith('avatars/') || path.startsWith('intros/')) {
    const { data } = supabase.storage.from('profiles').getPublicUrl(path);
    return data?.publicUrl ?? u;
  }
  return u;
}

function defaultTheme(): ProfileTheme {
  return {
    accentColor: '#0a7ea4',
    backgroundGradient: ['#1a1a2e', '#16213e'],
    buttonShape: 'rounded',
    typography: 'sans',
    profileBorderColor: '#D4AF37',
  };
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
    backgroundImageUrl: resolveStorageUrlIfPath((row.background_image_url as string) ?? null),
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

function mapLinkFromDb(row: Record<string, unknown>): UserLink {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as UserLink['type'],
    title: row.title as string,
    url: row.url as string,
    platform: (row.platform as UserLink['platform']) ?? undefined,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  };
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

export async function upsertProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<UserProfile | null> {
  const theme = updates.theme ?? defaultTheme();
  const payload = {
    user_id: userId,
    username: (updates.username ?? '').toLowerCase(),
    name: updates.name ?? '',
    title: updates.title ?? '',
    bio: updates.bio ?? '',
    avatar_url: updates.avatarUrl ?? undefined,
    video_intro_url: updates.videoIntroUrl ?? undefined,
    background_image_url: updates.backgroundImageUrl ?? undefined,
    email: updates.email ?? '',
    phone: updates.phone ?? '',
    website: updates.website ?? '',
    theme,
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

// --- Saved contacts ---
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

export async function saveContact(
  contactUserId: string,
  displayName?: string,
  avatarUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Sign in to save contacts' };
  const raw = (avatarUrl ?? '').trim() || null;
  const resolved = raw ? resolveStorageUrlIfPath(raw) : null;
  const { error } = await supabase.from('user_contacts').insert({
    owner_id: user.id,
    contact_user_id: contactUserId,
    display_name: (displayName ?? '').trim(),
    avatar_url: resolved ?? raw,
  });
  if (error) {
    if (error.code === '23505') return { success: true };
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Mutual exchange: both users get each other as contacts. Used when opening from web "Exchange contact". */
export async function exchangeContact(
  contactUserId: string,
  displayName?: string,
  avatarUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { success: false, error: 'Sign in to exchange contacts' };
  try {
    const res = await fetch(`${RING_API_BASE}/api/exchange-contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        contact_user_id: contactUserId,
        display_name: displayName ?? '',
        avatar_url: avatarUrl ?? null,
      }),
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!res.ok) return { success: false, error: data.error ?? 'Exchange failed' };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Exchange failed' };
  }
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

export function canAddLink(plan: string, currentCount: number): boolean {
  if (plan === 'pro') return true;
  return currentCount < FREE_PLAN_MAX_LINKS;
}

export async function createLink(
  userId: string,
  link: Omit<UserLink, 'id' | 'userId' | 'createdAt'>
): Promise<UserLink | null> {
  const { data, error } = await supabase
    .from('links')
    .insert({
      user_id: userId,
      type: link.type,
      title: link.title,
      url: link.url,
      platform: link.platform ?? null,
      sort_order: link.sortOrder ?? 0,
    })
    .select()
    .single();
  if (error) return null;
  return mapLinkFromDb(data);
}

export async function updateLink(
  linkId: string,
  updates: Partial<Pick<UserLink, 'title' | 'url' | 'type' | 'platform' | 'sortOrder'>>
): Promise<UserLink | null> {
  const row: Record<string, unknown> = {};
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.url !== undefined) row.url = updates.url;
  if (updates.type !== undefined) row.type = updates.type;
  if (updates.platform !== undefined) row.platform = updates.platform;
  if (updates.sortOrder !== undefined) row.sort_order = updates.sortOrder;
  if (Object.keys(row).length === 0) return null;
  const { data, error } = await supabase.from('links').update(row).eq('id', linkId).select().single();
  if (error) return null;
  return mapLinkFromDb(data);
}

export async function deleteLink(linkId: string): Promise<boolean> {
  const { error } = await supabase.from('links').delete().eq('id', linkId);
  return !error;
}

// --- Profile URLs ---
export function getProfileUrl(username: string): string {
  return `${PROFILE_URL_BASE}/${username}`;
}
export function getProfileUrlNfc(username: string): string {
  return `${PROFILE_URL_BASE}/nfc/${username}`;
}
export function getProfileUrlQr(username: string): string {
  return `${PROFILE_URL_BASE}/qr/${username}`;
}

// --- Ring (NFC) ---
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

export async function setupRingViaApi(
  accessToken: string,
  ringId: string
): Promise<{ success: boolean; error?: string; already_linked?: boolean }> {
  try {
    const res = await fetch(`${RING_API_BASE}/api/ring/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ setup_id: ringId.trim() }),
    });
    const data = (await res.json()) as { success?: boolean; error?: string; already_linked?: boolean };
    if (!res.ok) return { success: false, error: data.error ?? 'Setup failed' };
    return { success: true, already_linked: data.already_linked };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Setup failed' };
  }
}

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

// --- Subscription ---
export async function getSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return data;
}

/** Fetch plan for display (e.g. verified badge) from website API. Use when direct subscription read may be blocked by RLS. */
export async function getProfilePlanFromApi(userId: string): Promise<'free' | 'pro'> {
  try {
    const res = await fetch(`${PROFILE_URL_BASE}/api/profile?uid=${encodeURIComponent(userId)}`);
    if (!res.ok) return 'free';
    const data = (await res.json()) as { plan?: string };
    return data?.plan === 'pro' ? 'pro' : 'free';
  } catch {
    return 'free';
  }
}

// --- Analytics ---
const ANALYTICS_TYPES = ['profile_view', 'link_click', 'nfc_tap', 'qr_scan'] as const;

export async function getAnalytics(
  profileId: string,
  periodDays: number
): Promise<AnalyticsSummary> {
  const since = new Date();
  since.setDate(since.getDate() - periodDays);
  const sinceStr = since.toISOString();
  const { data, error } = await supabase
    .from('analytics_events')
    .select('type, created_at')
    .eq('profile_id', profileId)
    .gte('created_at', sinceStr);
  if (error) throw new Error(error.message);
  const events = (data ?? []) as Array<{ type: string; created_at: string }>;
  const profileViews = events.filter((e) => e.type === 'profile_view').length;
  const linkClicks = events.filter((e) => e.type === 'link_click').length;
  const nfcTaps = events.filter((e) => e.type === 'nfc_tap').length;
  const qrScans = events.filter((e) => e.type === 'qr_scan').length;
  const byDay: Array<{ date: string; count: number; type: string }> = [];
  const dayTypeMap = new Map<string, number>();
  for (const e of events) {
    const date = e.created_at.slice(0, 10);
    const key = `${date}:${e.type}`;
    dayTypeMap.set(key, (dayTypeMap.get(key) ?? 0) + 1);
  }
  dayTypeMap.forEach((count, key) => {
    const [date, type] = key.split(':');
    if (date && ANALYTICS_TYPES.includes(type as (typeof ANALYTICS_TYPES)[number])) {
      byDay.push({ date, type, count });
    }
  });
  byDay.sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
  return {
    profileViews,
    linkClicks,
    nfcTaps,
    qrScans,
    byDay,
  };
}

// --- Scanned contacts ---
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

export async function getScannedContacts(ownerUserId: string): Promise<ScannedContact[]> {
  const { data, error } = await supabase
    .from('scanned_contacts')
    .select('*')
    .eq('user_id', ownerUserId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map(mapScannedContactFromDb);
}

// --- Messaging ---
function normPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation | null> {
  if (userId1 === userId2) return null;
  const [u1, u2] = normPair(userId1, userId2);
  const { data: existing, error: fetchErr } = await supabase
    .from('conversations')
    .select('id, user1_id, user2_id, created_at, updated_at')
    .eq('user1_id', u1)
    .eq('user2_id', u2)
    .maybeSingle();
  if (fetchErr) return null;
  if (existing) {
    return {
      id: existing.id,
      user1Id: existing.user1_id,
      user2Id: existing.user2_id,
      createdAt: existing.created_at,
      updatedAt: existing.updated_at,
    };
  }
  const { data: inserted, error: insertErr } = await supabase
    .from('conversations')
    .insert({ user1_id: u1, user2_id: u2 })
    .select('id, user1_id, user2_id, created_at, updated_at')
    .single();
  if (insertErr) return null;
  return {
    id: inserted.id,
    user1Id: inserted.user1_id,
    user2Id: inserted.user2_id,
    createdAt: inserted.created_at,
    updatedAt: inserted.updated_at,
  };
}

export async function getConversations(myUserId: string): Promise<ConversationWithPeer[]> {
  const { data: rows, error } = await supabase
    .from('conversations')
    .select('id, user1_id, user2_id, updated_at')
    .or(`user1_id.eq.${myUserId},user2_id.eq.${myUserId}`)
    .order('updated_at', { ascending: false });
  if (error) return [];
  const out: ConversationWithPeer[] = [];
  for (const row of rows ?? []) {
    const peerId = row.user1_id === myUserId ? row.user2_id : row.user1_id;
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('body, created_at, sender_id, read_at')
      .eq('conversation_id', row.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastFromPeer = lastMsg && (lastMsg.sender_id as string) !== myUserId;
    const hasUnread = lastFromPeer && !(lastMsg.read_at as string | null);
    const { data: lastFromPeerMsg } = await supabase
      .from('messages')
      .select('body, created_at')
      .eq('conversation_id', row.id)
      .eq('sender_id', peerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const [profile, sub] = await Promise.all([getProfile(peerId), getSubscription(peerId)]);
    const peerIsPro = (sub?.plan as string) === 'pro';
    out.push({
      id: row.id,
      peerUserId: peerId,
      peerName: profile?.name?.trim() || 'Unknown',
      peerAvatarUrl: profile?.avatarUrl?.trim() || null,
      peerIsPro: !!peerIsPro,
      lastMessageBody: (lastFromPeerMsg?.body as string) ?? null,
      lastMessageAt: (lastFromPeerMsg?.created_at as string) ?? null,
      updatedAt: row.updated_at,
      hasUnread: !!hasUnread,
    });
  }
  return out;
}

/** Get conversation by id; returns the two participant user ids (user1_id < user2_id). */
export async function getConversation(conversationId: string): Promise<{ user1Id: string; user2Id: string } | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('user1_id, user2_id')
    .eq('id', conversationId)
    .maybeSingle();
  if (error || !data) return null;
  return { user1Id: data.user1_id, user2Id: data.user2_id };
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at, read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body as string,
    createdAt: row.created_at,
    readAt: row.read_at as string | null,
  }));
}

export async function sendMessage(conversationId: string, senderId: string, body: string): Promise<Message | null> {
  const trimmed = body.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body: trimmed })
    .select('id, conversation_id, sender_id, body, created_at, read_at')
    .single();
  if (error) return null;
  return {
    id: data.id,
    conversationId: data.conversation_id,
    senderId: data.sender_id,
    body: data.body,
    createdAt: data.created_at,
    readAt: data.read_at,
  };
}

/** Upsert push token for the current user (e.g. Expo push token). Reassigns token to this user if it was previously used by another. */
export async function savePushToken(
  userId: string,
  token: string,
  platform?: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('push_tokens').upsert(
    { user_id: userId, token, platform },
    { onConflict: 'token' }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Ask the Edge Function to send a push notification to the recipient for a new message. Fire-and-forget; call after sendMessage. */
export async function triggerPushForMessage(
  recipientUserId: string,
  body: string,
  conversationId: string
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return;
  const url = `${supabaseUrl}/functions/v1/send-message-push`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      recipient_user_id: recipientUserId,
      body,
      conversation_id: conversationId,
    }),
  });
  if (!res.ok) {
    // Fire-and-forget: log but don't throw
    console.warn('[push] send-message-push failed', res.status, await res.text());
  }
}

/** Delete the current user's account via Edge Function. Caller should sign out and redirect after. */
export async function deleteAccount(): Promise<{ ok: boolean; error?: string }> {
  const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !session?.access_token || !session.user) {
    return { ok: false, error: refreshError?.message ?? 'Not signed in' };
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({ userId: session.user.id }),
  });

  const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok) {
    return { ok: false, error: body.error ?? `Request failed (${res.status})` };
  }
  return body.ok === true ? { ok: true } : { ok: false, error: body.error ?? 'Delete failed' };
}

/** Delete a conversation (participant only; RLS enforces). Messages are deleted by cascade. */
export async function deleteConversation(conversationId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// --- Storage (avatar, video) ---
async function readFileAsArrayBuffer(uri: string, defaultMime = 'image/jpeg'): Promise<{ data: ArrayBuffer; mimeType: string }> {
  const u = uri.trim();
  if (u.startsWith('file://')) {
    const base64 = await FileSystem.readAsStringAsync(u, { encoding: 'base64' });
    const data = decodeBase64(base64);
    const ext = u.split('.').pop()?.split('?')[0]?.toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : defaultMime;
    return { data, mimeType };
  }
  const res = await fetch(u);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || defaultMime;
  return { data, mimeType: contentType.split(';')[0].trim() };
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
    if (uploadError) return { url: null, error: uploadError.message };
    const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(path);
    return { url: urlData?.publicUrl ?? null };
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : String(e) };
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
    if (uploadError) return { url: null, error: uploadError.message };
    const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(path);
    return { url: urlData?.publicUrl ?? null };
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function uploadBackgroundImage(userId: string, uri: string): Promise<UploadResult> {
  const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const path = `backgrounds/${userId}/${Date.now()}.${ext}`;
  try {
    const { data, mimeType } = await readFileAsArrayBuffer(uri);
    const { error: uploadError } = await supabase.storage.from('profiles').upload(path, data, {
      contentType: mimeType,
      upsert: true,
    });
    if (uploadError) return { url: null, error: uploadError.message };
    const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(path);
    return { url: urlData?.publicUrl ?? null };
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : String(e) };
  }
}
