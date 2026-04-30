/**
 * Server-side: notify app users via Supabase Edge Function (requires INTERNAL_PUSH_SECRET in Supabase + RINGTAP_INTERNAL_PUSH_SECRET in website env).
 */
function normalizeSupabaseUrl(raw: string): string {
  const t = raw.replace(/^["'\s]+|["'\s]+$/g, '').trim();
  if (!t) return '';
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export async function sendInternalContactPush(
  supabaseUrlRaw: string,
  recipientUserId: string,
  options: { title: string; body: string; data: Record<string, string> }
): Promise<void> {
  const secret = (process.env.RINGTAP_INTERNAL_PUSH_SECRET ?? '').replace(/^["']|["']$/g, '').trim();
  const base = normalizeSupabaseUrl(supabaseUrlRaw);
  if (!secret || !base) return;

  const url = `${base.replace(/\/$/, '')}/functions/v1/send-contact-push`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-push-secret': secret,
      },
      body: JSON.stringify({
        mode: 'internal' as const,
        recipient_user_id: recipientUserId,
        title: options.title,
        body: options.body,
        data: options.data,
      }),
    });
    if (!res.ok) {
      console.error('[internalContactPush]', res.status, await res.text());
    }
  } catch (e) {
    console.error('[internalContactPush]', e);
  }
}
