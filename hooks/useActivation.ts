import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export function useActivation() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = (url: string) => {
      const parsed = Linking.parse(url);
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
