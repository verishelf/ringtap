/**
 * Badge service: record app opens, check criteria, award badges.
 * Rewards users for coming back and engaging.
 */
import { supabase } from '@/lib/supabase/supabaseClient';
import { getAnalytics } from '@/lib/api';
import { getProfile } from '@/lib/api';
import { getSavedContacts } from '@/lib/api';

export type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  sortOrder: number;
};

export type UserBadge = Badge & {
  earnedAt: string;
};

/** Badge with earned status for display (all badges, earned or not). */
export type BadgeWithEarned = Badge & {
  earned: boolean;
  earnedAt?: string;
};

/** Record that the user opened the app today (idempotent per day). */
export async function recordAppOpen(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  await supabase.from('user_app_opens').upsert(
    { user_id: userId, opened_at: today },
    { onConflict: 'user_id,opened_at', ignoreDuplicates: true }
  );
}

/** Get all badge definitions. */
export async function getBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('id, slug, name, description, icon, color, category, sort_order')
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    icon: r.icon,
    color: r.color,
    category: r.category,
    sortOrder: r.sort_order,
  }));
}

/** Get all badges with earned status for a user. */
export async function getAllBadgesWithEarnedStatus(userId: string): Promise<BadgeWithEarned[]> {
  const [allBadges, earned] = await Promise.all([getBadges(), getUserBadges(userId)]);
  const earnedBySlug = new Map(earned.map((b) => [b.slug, b]));
  return allBadges.map((b) => {
    const e = earnedBySlug.get(b.slug);
    return {
      ...b,
      earned: !!e,
      earnedAt: e?.earnedAt,
    };
  });
}

/** Get badges earned by a user. */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      earned_at,
      badges (id, slug, name, description, icon, color, category, sort_order)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });
  if (error) return [];
  const rows = (data ?? []) as Array<{
    earned_at: string;
    badges: {
      id: string;
      slug: string;
      name: string;
      description: string;
      icon: string;
      color: string;
      category: string;
      sort_order: number;
    } | null;
  }>;
  return rows
    .filter((r) => r.badges)
    .map((r) => ({
      ...(r.badges as NonNullable<typeof r.badges>),
      sortOrder: (r.badges as NonNullable<typeof r.badges>).sort_order,
      earnedAt: r.earned_at,
    }));
}

/** Award a badge to a user (idempotent). */
async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  const { error } = await supabase.from('user_badges').upsert(
    { user_id: userId, badge_id: badgeId },
    { onConflict: 'user_id,badge_id' }
  );
  return !error;
}

/** Get consecutive day streak from app opens. */
async function getStreakDays(userId: string): Promise<number> {
  const { data } = await supabase
    .from('user_app_opens')
    .select('opened_at')
    .eq('user_id', userId)
    .order('opened_at', { ascending: false })
    .limit(60);
  const dates = (data ?? []).map((r) => (r.opened_at as string).slice(0, 10)).filter(Boolean);
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0; // streak broken
  let streak = 0;
  let prev = '';
  for (const d of sorted) {
    if (!prev) {
      streak = 1;
      prev = d;
      continue;
    }
    const prevDate = new Date(prev);
    const currDate = new Date(d);
    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 864e5);
    if (diffDays === 1) {
      streak++;
      prev = d;
    } else break;
  }
  return streak;
}

/** Check if user had a gap of 7+ days and then returned. */
async function qualifiesComebackKing(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_app_opens')
    .select('opened_at')
    .eq('user_id', userId)
    .order('opened_at', { ascending: false })
    .limit(20);
  const dates = (data ?? []).map((r) => (r.opened_at as string).slice(0, 10)).sort();
  if (dates.length < 2) return false;
  const unique = [...new Set(dates)].sort().reverse();
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const gapDays = Math.round((prev.getTime() - curr.getTime()) / 864e5);
    if (gapDays >= 7) return true; // had 7+ day gap, then came back
  }
  return false;
}

/** Check and award engagement badges. Call after recordAppOpen. */
export async function checkAndAwardBadges(userId: string): Promise<{ badges: UserBadge[]; newlyAwarded: UserBadge[] }> {
  const [earned, badgeDefs, profile] = await Promise.all([
    getUserBadges(userId),
    getBadges(),
    getProfile(userId),
  ]);
  const earnedSlugs = new Set(earned.map((b) => b.slug));
  const badgeBySlug = new Map(badgeDefs.map((b) => [b.slug, b]));
  const toAward: string[] = [];

  // Streak badges
  const streak = await getStreakDays(userId);
  if (streak >= 3 && !earnedSlugs.has('early_bird')) toAward.push('early_bird');
  if (streak >= 7 && !earnedSlugs.has('week_warrior')) toAward.push('week_warrior');
  if (streak >= 14 && !earnedSlugs.has('streak_master')) toAward.push('streak_master');
  if (streak >= 30 && !earnedSlugs.has('monthly_legend')) toAward.push('monthly_legend');

  // Comeback King
  if (!earnedSlugs.has('comeback_king') && (await qualifiesComebackKing(userId))) {
    toAward.push('comeback_king');
  }

  // Tap / sharing badges (need profile for analytics)
  if (profile?.id) {
    const analyticsWeek = await getAnalytics(profile.id, 7);
    const analyticsAll = await getAnalytics(profile.id, 365 * 2); // 2 years
    const tapsThisWeek = (analyticsWeek?.nfcTaps ?? 0) + (analyticsWeek?.qrScans ?? 0);
    const totalTaps = (analyticsAll?.nfcTaps ?? 0) + (analyticsAll?.qrScans ?? 0);
    if (totalTaps >= 1 && !earnedSlugs.has('first_tap')) toAward.push('first_tap');
    if (tapsThisWeek >= 5 && !earnedSlugs.has('tap_enthusiast')) toAward.push('tap_enthusiast');

    const totalViews = await getTotalProfileViews(profile.id);
    if (totalViews >= 100 && !earnedSlugs.has('profile_views_100')) toAward.push('profile_views_100');
    if (totalViews >= 1000 && !earnedSlugs.has('profile_views_1000')) toAward.push('profile_views_1000');
  }

  // Contact badges
  const saved = await getSavedContacts();
  const savedCount = saved?.length ?? 0;
  if (savedCount >= 1 && !earnedSlugs.has('first_contact')) toAward.push('first_contact');
  if (savedCount >= 10 && !earnedSlugs.has('networker')) toAward.push('networker');
  if (savedCount >= 50 && !earnedSlugs.has('super_connector')) toAward.push('super_connector');

  // Link badges (from profile - need to fetch links)
  const linkCount = await getLinkCount(userId);
  if (linkCount >= 1 && !earnedSlugs.has('profile_starter')) toAward.push('profile_starter');
  if (linkCount >= 5 && !earnedSlugs.has('link_pro')) toAward.push('link_pro');

  const newlyAwarded: UserBadge[] = [];
  for (const slug of toAward) {
    const badge = badgeBySlug.get(slug);
    if (badge) {
      const ok = await awardBadge(userId, badge.id);
      if (ok) {
        newlyAwarded.push({
          ...badge,
          earnedAt: new Date().toISOString(),
        });
      }
    }
  }

  const badges = await getUserBadges(userId);
  return { badges, newlyAwarded };
}

async function getTotalProfileViews(profileId: string): Promise<number> {
  const { count } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('type', 'profile_view');
  return count ?? 0;
}

async function getLinkCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}

/** Record app open and check badges. Call when user lands on home. */
export async function recordAppOpenAndCheckBadges(userId: string): Promise<{ badges: UserBadge[]; newlyAwarded: UserBadge[] }> {
  await recordAppOpen(userId);
  return checkAndAwardBadges(userId);
}
