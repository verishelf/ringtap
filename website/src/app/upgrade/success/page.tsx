'use client';

import Link from 'next/link';

export default function UpgradeSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-foreground">You&apos;re Pro!</h1>
        <p className="text-muted-light mt-2">
          Your subscription is active. Open the RingTap app to use unlimited links, themes, analytics, and video intro.
        </p>
        <Link
          href="ringtap://"
          className="mt-8 inline-block rounded-xl bg-accent text-background px-6 py-3 font-semibold"
        >
          Open RingTap app
        </Link>
        <p className="mt-6 text-sm text-muted-light">
          <Link href="/" className="text-accent hover:underline">Back to ringtap.me</Link>
        </p>
      </div>
    </div>
  );
}
