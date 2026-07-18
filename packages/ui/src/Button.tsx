import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './lib/cn';
import { Slot } from './lib/slot';
import { Spinner } from './Spinner';

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-body font-semibold rounded-token border border-transparent',
    'cursor-pointer select-none',
    'transition-[background-color,border-color,color,transform,box-shadow]',
    'duration-200 ease-[var(--ease-out-soft)]',
    'hover:-translate-y-px active:translate-y-0',
    'disabled:pointer-events-none disabled:opacity-55',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-brand-blue text-white hover:bg-brand-blue-600 hover:shadow-lift',
        outline:
          'bg-transparent text-brand-blue border-border hover:border-brand-blue hover:bg-bg-tint',
        ghost: 'bg-transparent text-text hover:bg-bg-tint-2 hover:text-text-strong',
        danger: 'bg-danger text-white hover:brightness-95 hover:shadow-lift',
        onNavy: 'bg-white text-brand-navy hover:bg-bg-tint',
      },
      size: {
        sm: 'px-3.5 py-2 text-sm',
        md: 'px-[1.375rem] py-3 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  /** Render the child element instead of a <button> (e.g. a Next <Link>). */
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading = false, asChild = false, disabled, children, ...props },
  ref,
) {
  const Comp = (asChild ? Slot : 'button') as React.ElementType;

  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      // `asChild` targets may not be <button>, so only send button-only attrs when they apply.
      {...(asChild ? {} : { type: props.type ?? 'button', disabled: disabled || loading })}
      aria-disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </Comp>
  );
});
