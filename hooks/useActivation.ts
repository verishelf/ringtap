import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export function useActivation() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = (url: string) => {
      const parsed = Linking.parse(url);
      // ringtap://profile/{userId} -> open profile screen (hostname can be "profile", path the id)
      const path = (parsed.path ?? '').trim() || (parsed.hostname ?? '').trim();
      const profileId =
        (parsed.hostname === 'profile' && path && path !== 'profile' ? path : null) ??
        (path.match(/^\/?profile\/([^/]+)/)?.[1] ?? path.match(/^profile\/([^/]+)/)?.[1]);
      if (profileId) {
        router.push(`/profile/${profileId}` as const);
        return;
      }

      // ringtap://setup/{setupId} -> QR setup flow
      const setupId =
        (parsed.hostname === 'setup' && path && path !== 'setup' ? path : null) ??
        (path.match(/^\/?setup\/([^/]+)/)?.[1] ?? path.match(/^setup\/([^/]+)/)?.[1]);
      if (setupId) {
        router.push(`/setup/${setupId}` as const);
        return;
      }

      // ringtap://activate?r=... or ringtap://activate?uid=...
      const ringId = (parsed?.queryParams?.r as string) ?? (parsed?.queryParams?.uid as string);
      if (ringId) {
        router.push(`/activate?r=${encodeURIComponent(ringId)}` as const);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const sub = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => sub.remove();
  }, [router]);
}
