/**
 * RevenueCat provider - initializes SDK and identifies users
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesOffering } from 'react-native-purchases';

import { ENTITLEMENT_ID, getRevenueCatApiKey } from '@/lib/revenuecat';
import { useSession } from '@/hooks/useSession';

type RevenueCatContextType = {
  /** Whether RevenueCat is available (not web, SDK initialized) */
  isAvailable: boolean;
  /** Current customer info from RevenueCat */
  customerInfo: CustomerInfo | null;
  /** Current offering (products) */
  offering: PurchasesOffering | null;
  /** Whether user has RingTap Pro entitlement */
  isPro: boolean;
  /** Refresh customer info and offering */
  refresh: () => Promise<void>;
  /** Loading state */
  loading: boolean;
};

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const configuredRef = useRef(false);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setIsAvailable(false);
      setLoading(false);
      return;
    }
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      const offerings = await Purchases.getOfferings();
      setOffering(offerings.current);
    } catch (e) {
      // SDK may not be configured (Expo Go) or network error
      setCustomerInfo(null);
      setOffering(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsAvailable(false);
      setLoading(false);
      return;
    }

    let mounted = true;

    let removeListener: (() => void) | null = null;

    const init = async () => {
      try {
        const apiKey = getRevenueCatApiKey();
        if (!apiKey) {
          if (mounted) setIsAvailable(false);
          return;
        }
        if (!configuredRef.current) {
          Purchases.configure({ apiKey });
          configuredRef.current = true;
        }
        if (mounted) setIsAvailable(true);

        // Identify user when logged in for cross-device sync
        if (user?.id) {
          const { customerInfo: info } = await Purchases.logIn(user.id);
          if (mounted) setCustomerInfo(info);
        } else {
          if (mounted) setCustomerInfo(await Purchases.getCustomerInfo());
        }

        const offerings = await Purchases.getOfferings();
        if (mounted) setOffering(offerings.current);

        // Listen for customer info updates (e.g. after purchase)
        const listener = (info: CustomerInfo) => {
          if (mounted) setCustomerInfo(info);
        };
        Purchases.addCustomerInfoUpdateListener(listener);
        removeListener = () => Purchases.removeCustomerInfoUpdateListener(listener);
      } catch (e) {
        // Expo Go / Preview API mode - SDK may not be fully initialized
        if (mounted) setIsAvailable(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => {
      mounted = false;
      removeListener?.();
    };
  }, [user?.id]);

  useEffect(() => {
    if (isAvailable && user?.id) {
      Purchases.logIn(user.id).then(({ customerInfo: info }) => setCustomerInfo(info)).catch(() => {});
    }
  }, [isAvailable, user?.id]);

  const isPro = !!(customerInfo?.entitlements?.active[ENTITLEMENT_ID]);

  return (
    <RevenueCatContext.Provider
      value={{
        isAvailable,
        customerInfo,
        offering,
        isPro,
        refresh,
        loading,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const ctx = useContext(RevenueCatContext);
  if (ctx === undefined) throw new Error('useRevenueCat must be used within RevenueCatProvider');
  return ctx;
}
