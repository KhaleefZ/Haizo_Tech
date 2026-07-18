'use client';

import * as React from 'react';
import { cn } from './lib/cn';
import { controlClasses } from './Input';
import { useFieldControl } from './lib/field-context';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  const field = useFieldControl();
  return (
    <textarea
      ref={ref}
      className={cn(controlClasses, 'min-h-32 resize-y', className)}
      {...field}
      {...props}
    />
  );
});
