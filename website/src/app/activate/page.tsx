'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type RingStatus = {
  status: 'unclaimed' | 'claimed';
  chip_uid: string;
  ring_model: string;
  model_url: string | null;
  owner_user_id: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ringtap.me';

export default function ActivatePage() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid') ?? '';
  const [data, setData] = useState<RingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!uid.trim()) {
      setError('Missing chip UID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/ring/status?uid=${encodeURIComponent(uid.trim())}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json);
      if (json.status === 'claimed' && json.owner_user_id) {
        window.location.href = `/profile/${encodeURIComponent(json.owner_user_id)}`;
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <p className="text-muted-light">Loading ring...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-destructive">{error ?? 'Invalid link'}</p>
        <Link href="/" className="text-accent hover:underline">Back to RingTap</Link>
      </div>
    );
  }

  if (data.status === 'claimed' && data.owner_user_id) {
    window.location.href = `/profile/${encodeURIComponent(data.owner_user_id)}`;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <p className="text-muted-light">Redirecting to profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-2xl font-bold text-foreground">Ring not yet activated</h1>
        <p className="text-muted-light">
          This NFC ring is unclaimed. Open the RingTap app to claim it and link it to your profile.
        </p>
        <div className="rounded-2xl border border-border-light bg-surface p-8 flex items-center justify-center min-h-[200px]">
          <span className="text-6xl text-accent" aria-hidden>⌖</span>
        </div>
        <a
          href={`ringtap://activate?uid=${encodeURIComponent(uid)}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-background font-semibold hover:opacity-90 transition-opacity"
        >
          Open in App
        </a>
        <p className="text-sm text-muted">
          Don’t have the app? <Link href="https://apps.apple.com/app/ringtap" className="text-accent hover:underline">Download RingTap</Link>
        </p>
      </div>
    </div>
  );
}
