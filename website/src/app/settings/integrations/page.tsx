'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const connected = searchParams.get('connected');
  const error = searchParams.get('error');

  if (connected === 'hubspot') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">HubSpot connected</h1>
          <p className="text-muted-light mb-8">
            Your RingTap contacts can now sync to HubSpot. Open the app and go to Contacts → Sync to CRM.
          </p>
          <a
            href="ringtap://settings/integrations"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-background font-semibold hover:opacity-90"
          >
            Open RingTap app
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Connection failed</h1>
          <p className="text-muted-light mb-8">{decodeURIComponent(error)}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-light px-6 py-3 text-foreground font-semibold hover:bg-surface"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">CRM Integrations</h1>
        <p className="text-muted-light mb-8">
          Connect your CRM from the RingTap app: Settings → Integrations.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-background font-semibold hover:opacity-90"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading…</div>}>
      <IntegrationsContent />
    </Suspense>
  );
}
