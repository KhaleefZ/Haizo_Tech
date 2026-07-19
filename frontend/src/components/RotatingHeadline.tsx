'use client';

import { useEffect, useState } from 'react';

/**
 * The hero's dynamic line: "We build <service>." cycling through the services
 * that are actually published, so the headline can never advertise something the
 * services page doesn't list.
 *
 * The full list is rendered for screen readers and search engines; only the
 * visual layer rotates.
 */
export function RotatingHeadline({ items }: { items: string[] }) {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setAnimate(true);
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 2600);
    return () => clearInterval(id);
  }, [items.length]);

  const current = items[index] ?? items[0] ?? '';

  return (
    <h1 className="mt-4 text-display">
      We build{' '}
      <span className="relative inline-block align-bottom">
        <span
          key={index}
          className={`block text-brand-blue ${animate ? 'animate-[rise_500ms_cubic-bezier(0.16,1,0.3,1)]' : ''}`}
        >
          {current.toLowerCase()}.
        </span>
      </span>
      <span className="sr-only">{items.join(', ')}.</span>
    </h1>
  );
}
