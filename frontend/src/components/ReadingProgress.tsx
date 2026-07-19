'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The design's sticky reading rail — a 2px track that fills as the article
 * scrolls past.
 *
 * Three constraints shape this:
 *
 * 1. No layout shift. The track is a real 2px-high element in flow from the
 *    first paint; the fill is absolutely positioned inside it, so nothing
 *    reflows when progress updates.
 * 2. The fill animates `transform: scaleX()`, not `width`. Width would relayout
 *    on every scroll frame; a scale from a left origin is composited.
 * 3. Reduced motion makes it inert — the listener is never attached and the
 *    fill never renders, so the rail sits as a static hairline rule.
 *
 * It is decorative: the reader's position is already conveyed by the scrollbar,
 * so the whole thing is hidden from assistive technology.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const fillRef = useRef<HTMLSpanElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setAnimate(true);

    let frame = 0;

    const update = () => {
      frame = 0;
      const target = document.getElementById(targetId);
      const fill = fillRef.current;
      if (!target || !fill) return;

      const box = target.getBoundingClientRect();
      // Progress runs from "the article's top edge reaches the bottom of the
      // viewport" to "its bottom edge leaves the top" — the same span the
      // mockup's rail covers.
      const travelled = window.innerHeight - box.top;
      const total = box.height + window.innerHeight;
      const pct = Math.max(0, Math.min(1, total > 0 ? travelled / total : 0));
      fill.style.transform = `scaleX(${pct.toFixed(4)})`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetId]);

  return (
    <div
      aria-hidden="true"
      className="sticky top-[72px] z-30 h-[2px] overflow-hidden rounded-[2px] bg-border"
    >
      {animate && (
        <span
          ref={fillRef}
          className="absolute inset-0 origin-left scale-x-0 rounded-[2px] bg-hero-gradient transition-transform duration-150 ease-linear"
        />
      )}
    </div>
  );
}
