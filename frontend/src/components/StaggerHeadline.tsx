'use client';

import { useEffect, useState } from 'react';

/**
 * The staggered-word headline from the approved design — each word fades up in
 * sequence, with the final phrase landing last on its own line.
 *
 * Renders fully visible first and only animates once mounted, so a failed or
 * disabled JS bundle still leaves a readable H1 rather than a blank hero.
 */
export function StaggerHeadline({ words, tail }: { words: string[]; tail: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setReady(true);
  }, []);

  return (
    <h1 className="mt-4 text-display">
      {words.map((w, i) => (
        <span
          key={w + i}
          className={ready ? 'inline-block animate-[rise_600ms_cubic-bezier(0.16,1,0.3,1)_backwards]' : 'inline-block'}
          style={ready ? { animationDelay: `${i * 60}ms` } : undefined}
        >
          {w}
          {' '}
        </span>
      ))}
      <span
        className={`block text-brand-blue ${ready ? 'animate-[rise_600ms_cubic-bezier(0.16,1,0.3,1)_backwards]' : ''}`}
        style={ready ? { animationDelay: `${words.length * 60 + 60}ms` } : undefined}
      >
        {tail}
      </span>
    </h1>
  );
}
