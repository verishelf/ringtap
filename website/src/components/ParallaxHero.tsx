'use client';

import { useEffect, useRef, useState } from 'react';

export function ParallaxHero({ children }: { children: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [sectionTop, setSectionTop] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        if (sectionRef.current) {
          const rect = sectionRef.current.getBoundingClientRect();
          setSectionTop(rect.top + window.scrollY);
        }
        rafRef.current = 0;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const factor1 = reduceMotion ? 0 : 0.1;
  const factor2 = reduceMotion ? 0 : 0.15;
  const factor3 = reduceMotion ? 0 : 0.06;
  const scrollInSection = Math.max(0, scrollY - sectionTop);
  const offset1 = scrollInSection * factor1;
  const offset2 = scrollInSection * factor2;
  const offset3 = scrollInSection * factor3;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden pt-32 pb-24 px-6 md:pt-40 md:pb-32"
      aria-label="Introduction"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-[0.07] blur-3xl will-change-transform"
          style={{
            transform: `translateY(${offset1}px)`,
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-[0.06] blur-3xl will-change-transform"
          style={{
            transform: `translateY(${offset2}px)`,
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full opacity-[0.04] blur-3xl will-change-transform"
          style={{
            transform: `translate(-50%, calc(-50% + ${offset3}px))`,
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </section>
  );
}
