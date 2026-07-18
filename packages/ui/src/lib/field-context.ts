'use client';

import * as React from 'react';

export interface FieldContextValue {
  controlId: string;
  hintId: string | undefined;
  errorId: string | undefined;
  invalid: boolean;
  required: boolean;
}

export const FieldContext = React.createContext<FieldContextValue | null>(null);

/**
 * Attributes a form control should spread to inherit its `Field`'s wiring.
 * Returns empty when the control is used standalone, so nothing is forced.
 */
export function useFieldControl(): {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  required?: boolean;
} {
  const field = React.useContext(FieldContext);
  if (!field) return {};

  const describedBy = [field.hintId, field.errorId].filter(Boolean).join(' ');
  return {
    id: field.controlId,
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(field.invalid ? { 'aria-invalid': true as const } : {}),
    ...(field.required ? { required: true } : {}),
  };
}
