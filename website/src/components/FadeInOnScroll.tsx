'use client';

import { useEffect, useRef, useState } from 'react';

/** Wraps children with fade-in + slide-up when scrolled into view. Respects prefers-reduced-motion. */
type Props = {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms for staggered animations */
  delay?: number;
  /** Root margin - trigger when element is this far from viewport */
  rootMargin?: string;
  threshold?: number;
  as?: keyof JSX.IntrinsicElements;
};

export function FadeInOnScroll({
  children,
  className = '',
  delay = 0,
  rootMargin = '0px 0px -60px 0px',
  threshold = 0,
  as: Tag = 'div',
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const h = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  useEffect(() => {
    if (reduceMotion) setVisible(true);
  }, [reduceMotion]);

  const show = visible || reduceMotion;

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${reduceMotion ? '' : 'transition-all duration-700 ease-out'} ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      style={show && !reduceMotion && delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
