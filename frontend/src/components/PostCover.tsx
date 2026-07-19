'use client';

import { useState } from 'react';

/**
 * Cover image for a post, over the design's glyph panel.
 *
 * `imageUrl` comes from the CMS and is not guaranteed to resolve — the column
 * currently holds `/uploads/…` paths that nothing serves, and an upload can be
 * removed from under a published post at any time.
 *
 * The glyph is therefore the base layer and always renders; the image is laid
 * over it and only becomes visible once it has actually decoded. An `onError`
 * fallback was the obvious approach and is wrong: the broken <img> is in the
 * server-rendered markup, so a broken-image icon paints in the panel for the
 * whole round trip before the error fires. Revealing on load instead means a
 * failing URL is never seen at all, and a working one still gets used.
 *
 * The parent must be a positioned element. Decorative in both layers.
 */

/**
 * Legacy uploads are not servable yet.
 *
 * The Blog rows carry `/uploads/<uuid>.png` paths inherited from the old system.
 * Those files live on the old VPS, the new backend has no route for them, and
 * even once it does, helmet's Cross-Origin-Resource-Policy blocks embedding an
 * API-hosted image from the site's origin. So the browser fires a request that
 * always fails and logs a console error on every blog page.
 *
 * Rather than render a request we know cannot succeed, skip it and use the
 * glyph. Phase 6 moves uploads to R2 behind a public URL; at that point these
 * URLs resolve, this guard stops matching, and images appear with no code change.
 */
function isServable(src: string): boolean {
  if (src.startsWith('/uploads/')) return false;
  try {
    return !new URL(src, 'http://x').pathname.startsWith('/uploads/');
  } catch {
    return false;
  }
}

export function PostCover({
  src,
  imgClassName = '',
  children,
}: {
  src: string | null | undefined;
  imgClassName?: string;
  children: React.ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);
  // Narrow to a plain string so the <img> src is typed, rather than keeping a
  // separate boolean that TypeScript cannot use to narrow.
  const usableSrc = src && isServable(src) ? src : null;

  return (
    <>
      {children}
      {usableSrc && !broken && (
        <img
          src={usableSrc}
          alt=""
          aria-hidden="true"
          onLoad={() => setLoaded(true)}
          onError={() => setBroken(true)}
          className={`absolute inset-0 transition-opacity duration-300 ease-out-soft ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${imgClassName}`}
        />
      )}
    </>
  );
}
