'use client';

import { useEffect, useRef, useState } from 'react';

type Direction = 'up' | 'left' | 'right' | 'scale';

const HIDDEN: Record<Direction, string> = {
  up: 'translate-y-8 opacity-0',
  left: '-translate-x-10 opacity-0',
  right: 'translate-x-10 opacity-0',
  scale: 'translate-y-4 scale-[0.97] opacity-0',
};

const SHOWN: Record<Direction, string> = {
  up: 'translate-y-0 opacity-100',
  left: 'translate-x-0 opacity-100',
  right: 'translate-x-0 opacity-100',
  scale: 'translate-y-0 scale-100 opacity-100',
};

/**
 * Scroll reveal.
 *
 * Two things here are load-bearing and easy to get wrong:
 *
 * 1. The transition must list `translate`, not just `transform`. Tailwind v4
 *    emits `translate-y-*` onto the standalone `translate` CSS property, so
 *    `transition-[opacity,transform]` animates the fade and SNAPS the movement.
 *    That single mismatch made every reveal on the site look motionless.
 *
 * 2. It renders visible and only hides once the observer is attached, so a
 *    failed or disabled bundle leaves the content readable rather than blank.
 */
export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  immediate = false,
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
  /** Skip the observer and animate straight away — for above-the-fold content. */
  immediate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    const el = ref.current;
    if (!el) return;

    setShown(false);

    if (immediate) {
      const id = setTimeout(() => setShown(true), delay + 40);
      return () => clearTimeout(id);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setTimeout(() => setShown(true), delay);
          io.disconnect();
        }
      },
      // Fire slightly before the element is fully in view, so the motion is
      // finishing as it arrives rather than starting after it has landed.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay, immediate]);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,translate,transform] duration-700 ease-out-soft ${
        shown ? SHOWN[direction] : HIDDEN[direction]
      } ${className}`}
    >
      {children}
    </div>
  );
}
