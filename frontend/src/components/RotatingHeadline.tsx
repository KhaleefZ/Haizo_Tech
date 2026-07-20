'use client';

import { Typewriter } from './Typewriter';

/**
 * The hero's dynamic line: "We build <service>." typing through the services that
 * are actually published, so the headline can never advertise something the
 * services page doesn't list.
 *
 * The full list is rendered for screen readers and search engines; only the
 * visual layer animates.
 */
export function RotatingHeadline({ items }: { items: string[] }) {
  const phrases = items.map((s) => `${s.toLowerCase()}.`);

  return (
    <h1 className="mt-4 text-display">
      <Typewriter
        prefix="We build "
        phrases={phrases}
        prefixClassName="text-text-strong"
        className="text-brand-blue"
      />
      <span className="sr-only">We build {items.join(', ')}.</span>
    </h1>
  );
}
