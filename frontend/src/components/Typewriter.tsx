'use client';

import { useEffect, useState } from 'react';

/**
 * A "writing" (typewriter) effect. It types each phrase out character by
 * character, and — when given more than one — pauses, deletes, and moves to the
 * next, forever.
 *
 * Accessibility & no-JS: the first phrase is rendered in full on the server, so a
 * crawler, a screen reader, or a failed bundle all see a complete heading. With
 * reduced motion the animation never starts and the text stays put. The caller
 * composes the surrounding <h1>; this only owns the animated span + caret.
 */
export function Typewriter({
  phrases,
  loop,
  className,
  caretClassName = 'text-brand-blue',
  typeSpeed = 55,
  deleteSpeed = 28,
  pause = 1600,
}: {
  phrases: string[];
  loop?: boolean;
  className?: string;
  caretClassName?: string;
  typeSpeed?: number;
  deleteSpeed?: number;
  pause?: number;
}) {
  const shouldLoop = loop ?? phrases.length > 1;
  const first = phrases[0] ?? '';
  const [text, setText] = useState(first);
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
    const full = phrases[index] ?? '';

    // Reached the full phrase.
    if (!deleting && text === full) {
      if (!shouldLoop) {
        setDone(true); // single phrase: type once and stop
        return;
      }
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    // Fully deleted → advance to the next phrase.
    if (deleting && text === '') {
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
  }, [text, deleting, index, animating, done, phrases, shouldLoop, pause, typeSpeed, deleteSpeed]);

  return (
    <>
      <span className={className}>{text}</span>
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
