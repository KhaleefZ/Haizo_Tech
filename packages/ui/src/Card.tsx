import * as React from 'react';
import { cn } from './lib/cn';
import { Slot } from './lib/slot';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lifts on hover — use only when the whole card is a link or button. */
  linkable?: boolean;
  /** Drop the default padding, for cards built from CardHeader/CardBody. */
  flush?: boolean;
  asChild?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, linkable = false, flush = false, asChild = false, ...props },
  ref,
) {
  const Comp = (asChild ? Slot : 'div') as React.ElementType;
  return (
    <Comp
      ref={ref}
      className={cn(
        'bg-card border border-border rounded-token shadow-card',
        'transition-[box-shadow,border-color,transform] duration-300 ease-[var(--ease-out-soft)]',
        flush ? 'overflow-hidden' : 'p-5',
        linkable && 'hover:-translate-y-[3px] hover:border-brand-blue hover:shadow-lift',
        className,
      )}
      {...props}
    />
  );
});

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between gap-3 border-b border-border px-5 py-4',
        className,
      )}
      {...props}
    />
  );
});

export type CardBodyProps = React.HTMLAttributes<HTMLDivElement>;

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(function CardBody(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('p-5', className)} {...props} />;
});
