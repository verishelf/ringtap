import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { getSubscription } from '@/lib/api';

export function useSubscription() {
  const { user } = useSession();
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setPlan('free');
      setLoading(false);
      return;
    }
    setLoading(true);
    const sub = await getSubscription(user.id);
    setPlan((sub?.plan as 'free' | 'pro') ?? 'free');
    setStatus(sub?.status ?? null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPro = plan === 'pro';

  return { plan, status, loading, refresh, isPro };
}
