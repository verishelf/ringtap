import { useEffect, useState } from 'react';

/**
 * Cycles through labels on an interval while `enabled`. Resets when `enabled` becomes true.
 */
export function useRotatingLabel(
  messages: readonly string[],
  intervalMs: number,
  enabled: boolean
): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (enabled) setIndex(0);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || messages.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, messages]);

  return messages[index] ?? messages[0] ?? '';
}
