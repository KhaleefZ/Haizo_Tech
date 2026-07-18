import * as React from 'react';
import { cn } from './lib/cn';

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { className, icon, title, description, action, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn('px-5 py-12 text-center', className)} {...props}>
      {icon ? (
        <div
          aria-hidden
          className="mx-auto mb-4 grid size-11 place-items-center rounded-[10px] bg-bg-tint-2 text-brand-blue"
        >
          {icon}
        </div>
      ) : null}

      <h3 className="text-h4">{title}</h3>

      {description ? (
        <p className="mx-auto mt-2 max-w-prose text-sm text-text-muted">{description}</p>
      ) : null}

      {action ? <div className="mt-6 flex justify-center gap-3">{action}</div> : null}
    </div>
  );
});
