/**
 * In-app support chat: set EXPO_PUBLIC_SUPPORT_USER_ID to your Supabase auth user id
 * (Dashboard → Authentication → Users, or query profiles). Users can open a DM with that account from Help or Messages.
 */
export function getSupportUserId(): string | null {
  const id = process.env.EXPO_PUBLIC_SUPPORT_USER_ID?.trim();
  if (!id || id.length < 10) return null;
  return id;
}
