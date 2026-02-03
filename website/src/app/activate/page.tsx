"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function ActivateContent() {
  const params = useSearchParams();
  const ringId = params.get("r");

  useEffect(() => {
    if (!ringId) return;

    const run = async () => {
      try {
        const res = await fetch(`/api/activate?r=${ringId}`);
        const data = await res.json();
        if (data.deepLink) {
          window.location.href = data.deepLink;
        }
      } catch {
        // Stay on page; user can retry or go back
      }
    };

    run();
  }, [ringId]);

  return (
    <div style={{ padding: 40 }}>
      <h1>Activating Ring…</h1>
      <p>This will only take a moment.</p>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 40 }}>
        <h1>Activating Ring…</h1>
        <p>This will only take a moment.</p>
      </div>
    }>
      <ActivateContent />
    </Suspense>
  );
}
