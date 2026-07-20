'use client';

import * as React from 'react';
import { Input, cn, type InputProps } from '@haizo/ui';

/**
 * A password field with a show/hide toggle. Wraps the shared Input so it keeps
 * the same styling and Field-context behaviour; the eye button flips the input
 * type without disturbing the value.
 */
export function PasswordInput({ className, ...props }: Omit<InputProps, 'type'>) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className={cn('pr-11', className)} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        tabIndex={-1}
        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-text-muted transition-colors hover:bg-bg-tint hover:text-text-strong"
      >
        {show ? (
          <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
            <path
              d="M8.5 5.2A6.9 6.9 0 0 1 10 5c4 0 7 4 7 5a8 8 0 0 1-1.7 2.3M5.2 6.7C3.5 7.9 2 9.5 2 10c0 1 3 5 7 5a6.7 6.7 0 0 0 3-.7M3 3l14 14M9 9.2a1.5 1.5 0 0 0 1.9 1.9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
            <path
              d="M2 10c0-1 3-5 8-5s8 4 8 5-3 5-8 5-8-4-8-5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </button>
    </div>
  );
}
