'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * A short fade-and-lift when the route changes, so switching tabs reads as a
 * transition rather than a hard cut.
 *
 * Deliberately cheap: it keys off the pathname and replays a CSS animation. No
 * exit animation, because holding the old page back would delay the new one —
 * perceived speed matters more here than symmetry.
 *
 * Content is never hidden waiting for JS: the animation only ever fades IN, so
 * if it fails to run the page is simply visible.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <div
      key={enabled ? pathname : 'static'}
      className={enabled ? 'animate-[page-in_320ms_cubic-bezier(0.16,1,0.3,1)]' : undefined}
    >
      {children}
    </div>
  );
}
