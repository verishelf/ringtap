"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const COOKIE_NAME = "ringtap_ref";
const COOKIE_DAYS = 30;

function setRefCookie(code: string) {
  const maxAge = COOKIE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(code)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getAffiliateRef(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function AffiliateRefCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && /^[A-Za-z0-9]{4,16}$/.test(ref)) {
      setRefCookie(ref);
    }
  }, [searchParams]);

  return null;
}

export function AffiliateRefProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AffiliateRefCapture />
      </Suspense>
      {children}
    </>
  );
}
