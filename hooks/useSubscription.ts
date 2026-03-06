import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { getSubscription } from '@/lib/api';

export type SubscriptionRow = {
  id?: string;
  user_id?: string;
  plan?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  status?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export function useSubscription() {
  const { user } = useSession();
  const { isPro: isProFromRevenueCat, refresh: refreshRevenueCat, isAvailable: isRevenueCatAvailable } = useRevenueCat();
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [status, setStatus] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    await refreshRevenueCat();
    if (!user?.id) {
      setPlan('free');
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const sub = await getSubscription(user.id);
    setPlan((sub?.plan as 'free' | 'pro') ?? 'free');
    setStatus(sub?.status ?? null);
    setSubscription(sub ?? null);
    setLoading(false);
  }, [user?.id, refreshRevenueCat]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Pro from RevenueCat (IAP) or Supabase (Stripe/web) */
  const isPro = isProFromRevenueCat || plan === 'pro';
  /** True if Pro was purchased via Stripe/web (manage via Stripe portal). False = IAP or unknown. */
  const hasStripeSubscription = !!subscription?.stripe_subscription_id || !!subscription?.stripe_customer_id;
  /** True if Pro from RevenueCat IAP - use Customer Center for management */
  const hasRevenueCatSubscription = isRevenueCatAvailable && isProFromRevenueCat;

  return {
    plan,
    status,
    subscription,
    loading,
    refresh,
    isPro,
    hasStripeSubscription,
    hasRevenueCatSubscription,
  };
}
