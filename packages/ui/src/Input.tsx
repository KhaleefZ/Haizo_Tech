'use client';

import * as React from 'react';
import { cn } from './lib/cn';
import { useFieldControl } from './lib/field-context';

export const controlClasses = [
  'w-full font-body text-base text-text-strong bg-bg',
  'border border-border rounded-lg px-3.5 py-2.5',
  'placeholder:text-text-muted',
  'transition-[border-color,box-shadow] duration-150 ease-[var(--ease-out-soft)]',
  // Replaces the global outline with an equally visible ring, matching the prototype.
  'focus:outline-none focus:border-brand-blue focus:ring-[3px] focus:ring-blue-ring',
  'disabled:cursor-not-allowed disabled:bg-bg-tint disabled:text-text-muted',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20',
].join(' ');

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  const field = useFieldControl();
  return <input ref={ref} className={cn(controlClasses, className)} {...field} {...props} />;
});
