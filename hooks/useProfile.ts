import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { getProfile, upsertProfile } from '@/lib/api';
import type { UserProfile } from '@/lib/supabase/types';

export function useProfile() {
  const { user } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const p = await getProfile(user.id);
      setProfile(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateProfile = useCallback(
    async (updates: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
      if (!user?.id) return null;
      const updated = await upsertProfile(user.id, updates);
      if (updated) setProfile(updated);
      return updated;
    },
    [user?.id]
  );

  return { profile, loading, error, refresh, updateProfile };
}
