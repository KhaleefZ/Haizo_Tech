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
 * Only bare, relative `/uploads/<uuid>` paths are unservable — those are inherited
 * from the OLD system, whose files live on a host the new backend doesn't serve.
 *
 * Absolute upload URLs are the NEW ones: Phase 6 stores uploads on local disk and
 * serves them at an absolute UPLOADS_PUBLIC_URL with Cross-Origin-Resource-Policy:
 * cross-origin, so they embed fine. Anything absolute is therefore usable.
 */
function isServable(src: string): boolean {
  return !src.startsWith('/uploads/');
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
