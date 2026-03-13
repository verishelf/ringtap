/**
 * Scan tab - camera to scan business card text (OCR)
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { CardScanner } from '@/components/CardScanner';
import { useSession } from '@/hooks/useSession';

export default function ScanTab() {
  const { user } = useSession();
  const [focused, setFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  return <CardScanner userId={user?.id ?? ''} onSaved={() => {}} focused={focused} />;
}
