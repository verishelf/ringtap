import { useCallback, useEffect, useState } from 'react';
import {
  recordAppOpenAndCheckBadges,
  getUserBadges,
  getAllBadgesWithEarnedStatus,
  type UserBadge,
  type BadgeWithEarned,
} from '@/services/badgeService';
import { useSession } from '@/hooks/useSession';

export function useBadges() {
  const { user } = useSession();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeWithEarned[]>([]);
  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const dismissNewBadgeModal = useCallback(() => {
    setNewlyEarnedBadges((prev) => prev.slice(1));
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setBadges([]);
      setAllBadges([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [earned, all] = await Promise.all([
        getUserBadges(user.id),
        getAllBadgesWithEarnedStatus(user.id),
      ]);
      setBadges(earned);
      setAllBadges(all);
    } catch {
      setBadges([]);
      setAllBadges([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setBadges([]);
      setAllBadges([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    recordAppOpenAndCheckBadges(user.id)
      .then(async (result) => {
        if (mounted) {
          setBadges(result.badges);
          if (result.newlyAwarded.length > 0) {
            setNewlyEarnedBadges(result.newlyAwarded);
          }
          const all = await getAllBadgesWithEarnedStatus(user.id);
          setAllBadges(all);
        }
      })
      .catch(async () => {
        if (mounted) {
          const [earned, all] = await Promise.all([
            getUserBadges(user.id),
            getAllBadgesWithEarnedStatus(user.id),
          ]);
          setBadges(earned);
          setAllBadges(all);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return { badges, allBadges, loading, refresh, newlyEarnedBadges, dismissNewBadgeModal };
}
