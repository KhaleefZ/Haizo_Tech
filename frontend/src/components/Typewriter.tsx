'use client';

import { useEffect, useState } from 'react';

/**
 * A "writing" (typewriter) effect. It types each phrase out character by
 * character, and — when looping — pauses, deletes, and moves to the next.
 *
 * An optional `prefix` types out once on first load and then stays put while the
 * phrases after it cycle (e.g. "We build " + rotating services), so the whole
 * line writes itself on load but only the tail rotates afterwards.
 *
 * Accessibility & no-JS: the first phrase is rendered in full on the server, so a
 * crawler, a screen reader, or a failed bundle all see a complete heading. With
 * reduced motion the animation never starts and the text stays put. The caller
 * composes the surrounding <h1>; this only owns the animated span + caret.
 */
export function Typewriter({
  phrases,
  prefix = '',
  loop,
  className,
  prefixClassName,
  caretClassName = 'text-brand-blue',
  typeSpeed = 55,
  deleteSpeed = 28,
  pause = 1600,
}: {
  phrases: string[];
  prefix?: string;
  loop?: boolean;
  className?: string;
  prefixClassName?: string;
  caretClassName?: string;
  typeSpeed?: number;
  deleteSpeed?: number;
  pause?: number;
}) {
  const shouldLoop = loop ?? phrases.length > 1;
  const fullFor = (i: number) => prefix + (phrases[i] ?? '');
  const [text, setText] = useState(fullFor(0));
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [done, setDone] = useState(false);

  // Kick off after mount, so the server-rendered full phrase is what paints first.
  useEffect(() => {
    if (phrases.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setText('');
    setAnimating(true);
  }, [phrases.length]);

  useEffect(() => {
    if (!animating || done) return;
    const full = fullFor(index);

    // Reached the full phrase.
    if (!deleting && text === full) {
      if (!shouldLoop) {
        setDone(true); // single phrase: type once and stop
        return;
      }
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    // Deleted back to the prefix → advance to the next phrase (prefix stays put).
    if (deleting && text.length <= prefix.length) {
      const t = setTimeout(() => {
        setDeleting(false);
        setIndex((i) => (i + 1) % phrases.length);
      }, 350);
      return () => clearTimeout(t);
    }

    const t = setTimeout(
      () => setText(deleting ? full.slice(0, text.length - 1) : full.slice(0, text.length + 1)),
      deleting ? deleteSpeed : typeSpeed,
    );
    return () => clearTimeout(t);
  }, [text, deleting, index, animating, done, phrases, prefix, shouldLoop, pause, typeSpeed, deleteSpeed]);

  const shownPrefix = text.slice(0, Math.min(text.length, prefix.length));
  const shownSuffix = text.length > prefix.length ? text.slice(prefix.length) : '';

  return (
    <>
      <span className={prefixClassName}>{shownPrefix}</span>
      <span className={className}>{shownSuffix}</span>
      <span
        aria-hidden
        className={`ml-0.5 inline-block ${caretClassName} ${
          animating && !done ? 'animate-[caret-blink_1.05s_steps(1,end)_infinite]' : 'opacity-0'
        }`}
      >
        |
      </span>
    </>
  );
}
