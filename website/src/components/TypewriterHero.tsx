'use client';

import { useEffect, useState } from 'react';

const FULL_TEXT = 'Your digital business card. At your fingertip.';
const SPLIT_INDEX = 'Your digital business card. '.length; // "At your fingertip." starts here

export function TypewriterHero() {
  const [displayLength, setDisplayLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (displayLength >= FULL_TEXT.length) {
      setIsComplete(true);
      return;
    }
    const timer = setTimeout(() => {
      setDisplayLength((prev) => prev + 1);
    }, 60);
    return () => clearTimeout(timer);
  }, [displayLength]);

  const part1 = FULL_TEXT.slice(0, Math.min(displayLength, SPLIT_INDEX));
  const part2 = FULL_TEXT.slice(SPLIT_INDEX, displayLength);

  return (
    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl min-h-[1.2em]">
      <span aria-hidden>
        {part1}
        {part2 && <span className="text-accent">{part2}</span>}
        {!isComplete && (
          <span
            className="inline-block w-0.5 h-[0.9em] ml-0.5 align-middle bg-accent animate-cursor-blink"
            aria-hidden
          />
        )}
      </span>
      <span className="sr-only">{FULL_TEXT}</span>
    </h1>
  );
}
