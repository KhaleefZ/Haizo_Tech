import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './lib/cn';

export const badgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 rounded-full border border-transparent',
    'px-2.5 py-1 text-overline font-semibold tracking-[0.02em]',
  ],
  {
    variants: {
      variant: {
        neutral: 'bg-bg-tint text-text-muted border-border',
        brand: 'bg-bg-tint-2 text-brand-blue',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        danger: 'bg-danger/10 text-danger',
      },
    },
    defaultVariants: { variant: 'brand' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant, dot = false, children, ...props },
  ref,
) {
  return (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot ? <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
});
