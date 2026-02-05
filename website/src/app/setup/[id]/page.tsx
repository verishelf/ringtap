'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

const DEEP_LINK_SCHEME = 'ringtap://';

/**
 * QR setup flow: each ring package has a printed QR with setup ID.
 * User scans QR → lands here. Auth required to assign ring → open in app to link.
 * NFC activation still uses universal link (ringtap.me); username determines whose profile opens.
 */
export default function SetupRingPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id.trim() : '';

  if (!id) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <p className="text-muted-light text-center">Invalid setup link. Use the QR code from your ring package.</p>
        <Link href="/" className="mt-6 text-accent hover:underline">Back to RingTap</Link>
      </div>
    );
  }

  const appLink = `${DEEP_LINK_SCHEME}setup/${id}`;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-foreground text-center mb-2">Link your ring</h1>
      <p className="text-muted-light text-center mb-8">
        Open the RingTap app to assign this ring to your account. Your username will determine whose profile opens when someone taps your ring.
      </p>
      <a
        href={appLink}
        className="w-full rounded-xl bg-accent text-background px-6 py-4 text-center font-semibold text-lg hover:opacity-90 transition-opacity"
      >
        Open in RingTap app
      </a>
      <p className="text-xs text-muted-light mt-6 text-center">
        Don’t have the app? <Link href="/" className="text-accent hover:underline">Get RingTap</Link>
      </p>
    </div>
  );
}
