import * as React from 'react';
import { cn } from './lib/cn';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  /** Announce the busy state. Omit when a parent already conveys it. */
  label?: string;
}

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(function Spinner(
  { className, label, ...props },
  ref,
) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-4 shrink-0 animate-spin', className)}
      {...(label
        ? { role: 'status', 'aria-label': label }
        : { 'aria-hidden': true, focusable: false })}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
});
