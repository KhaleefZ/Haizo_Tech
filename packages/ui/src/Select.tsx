'use client';

import * as React from 'react';
import { cn } from './lib/cn';
import { controlClasses } from './Input';
import { useFieldControl } from './lib/field-context';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Shown as a disabled first option when the select has no value yet. */
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, placeholder, children, ...props },
  ref,
) {
  const field = useFieldControl();
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(controlClasses, 'cursor-pointer appearance-none pr-10', className)}
        {...field}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {children}
      </select>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
      >
        <path
          d="m5.5 8 4.5 4.5L14.5 8"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});
