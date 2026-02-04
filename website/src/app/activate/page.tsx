"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ActivateContent() {
  const params = useSearchParams();
  const ringId = params.get("r")?.trim() ?? "";
  const [status, setStatus] = useState<"loading" | "redirecting" | "error" | "no-id">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!ringId) {
      setStatus("no-id");
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const base = typeof window !== "undefined" ? window.location.origin : "";
        const res = await fetch(`${base}/api/activate?r=${encodeURIComponent(ringId)}`);
        let data: { deepLink?: string; error?: string } = {};
        try {
          data = await res.json();
        } catch {
          if (cancelled) return;
          setErrorMsg(`Server returned invalid response (${res.status}). Try again or use "Open in App" below.`);
          setStatus("error");
          return;
        }

        if (cancelled) return;

        if (!res.ok) {
          setErrorMsg(data?.error || `Request failed (${res.status})`);
          setStatus("error");
          return;
        }

        if (data.deepLink) {
          setStatus("redirecting");
          window.location.href = data.deepLink;
          return;
        }

        setErrorMsg("Invalid response from server");
        setStatus("error");
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Request failed";
        setErrorMsg(msg.toLowerCase().includes("fetch") ? "Network error. Check your connection or try again." : msg);
        setStatus("error");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [ringId]);

  const deepLink = ringId ? `ringtap://activate?r=${encodeURIComponent(ringId)}` : "";

  if (status === "no-id") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4">
        <h1 className="text-xl font-bold text-foreground">Missing ring ID</h1>
        <p className="text-muted-light text-center">
          This link should include a ring ID (e.g. ringtap.me/activate?r=...). If you tapped an NFC ring, try again.
        </p>
        <Link href="/" className="text-accent hover:underline">
          Back to RingTap
        </Link>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6 max-w-md">
        <h1 className="text-xl font-bold text-foreground">Couldn’t activate</h1>
        <p className="text-muted-light text-center">
          {errorMsg || "Something went wrong."} You can still open the app to claim this ring.
        </p>
        <p className="text-muted-light text-center text-sm">
          The link <strong className="text-foreground">ringtap.me/activate?r=&lt;RING_ID&gt;</strong> is the correct format to write to your NFC ring. If you see this often, try using <strong className="text-foreground">www.ringtap.me</strong> in the URL when programming the ring.
        </p>
        {deepLink && (
          <a
            href={deepLink}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-4 text-background font-semibold hover:opacity-90"
          >
            Open in App
          </a>
        )}
        <Link href="/" className="text-accent hover:underline text-sm">
          Back to RingTap
        </Link>
      </div>
    );
  }

  if (status === "redirecting") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4">
        <h1 className="text-xl font-bold text-foreground">Opening RingTap…</h1>
        <p className="text-muted-light">If the app didn’t open, use the button below.</p>
        {deepLink && (
          <a
            href={deepLink}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-4 text-background font-semibold hover:opacity-90"
          >
            Open in App
          </a>
        )}
      </div>
    );
  }

  // loading
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
      <h1 className="text-xl font-bold text-foreground">Activating Ring…</h1>
      <p className="text-muted-light">This will only take a moment.</p>
      {deepLink && (
        <a
          href={deepLink}
          className="inline-flex items-center justify-center rounded-xl border border-border-light px-6 py-3 text-foreground font-medium hover:bg-surface"
        >
          Open in App instead
        </a>
      )}
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4">
          <h1 className="text-xl font-bold text-foreground">Activating Ring…</h1>
          <p className="text-muted-light">This will only take a moment.</p>
        </div>
      }
    >
      <ActivateContent />
    </Suspense>
  );
}
