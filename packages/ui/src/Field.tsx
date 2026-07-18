'use client';

import * as React from 'react';
import { cn } from './lib/cn';
import { Label } from './Label';
import { FieldContext, type FieldContextValue } from './lib/field-context';

export interface FieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  label: React.ReactNode;
  /** Supply to control the id yourself; otherwise one is generated. */
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}

/**
 * Owns the label/control/hint/error relationship. Any `Input`, `Textarea` or
 * `Select` rendered inside picks up `id`, `aria-describedby` and `aria-invalid`
 * from context — consumers never wire ids by hand.
 */
export const Field = React.forwardRef<HTMLDivElement, FieldProps>(function Field(
  { className, label, htmlFor, hint, error, required = false, children, ...props },
  ref,
) {
  const generatedId = React.useId();
  const controlId = htmlFor ?? `${generatedId}-control`;
  const invalid = Boolean(error);

  const ctx = React.useMemo<FieldContextValue>(
    () => ({
      controlId,
      hintId: hint ? `${controlId}-hint` : undefined,
      errorId: invalid ? `${controlId}-error` : undefined,
      invalid,
      required,
    }),
    [controlId, hint, invalid, required],
  );

  return (
    <div ref={ref} className={cn('block', className)} {...props}>
      <Label htmlFor={controlId} required={required} className="mb-2">
        {label}
      </Label>

      <FieldContext.Provider value={ctx}>{children}</FieldContext.Provider>

      {hint ? (
        <p id={ctx.hintId} className="mt-2 text-sm text-text-muted">
          {hint}
        </p>
      ) : null}

      {invalid ? (
        <p id={ctx.errorId} className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});
