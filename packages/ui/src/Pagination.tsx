'use client';

import * as React from 'react';
import { cn } from './lib/cn';

export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  /** 1-based. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Pages shown either side of the current one. */
  siblingCount?: number;
  label?: string;
}

type Item = number | 'gap-start' | 'gap-end';

function buildRange(page: number, pageCount: number, siblingCount: number): Item[] {
  const items: Item[] = [];
  const first = 1;
  const last = pageCount;
  const start = Math.max(first + 1, page - siblingCount);
  const end = Math.min(last - 1, page + siblingCount);

  items.push(first);
  if (start > first + 1) items.push('gap-start');
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < last - 1) items.push('gap-end');
  if (last > first) items.push(last);

  return items;
}

const pageButton = [
  'inline-flex min-w-9 items-center justify-center rounded-lg border px-3 py-1.5',
  'text-sm font-semibold cursor-pointer',
  'transition-[background-color,border-color,color] duration-150 ease-[var(--ease-out-soft)]',
  'disabled:pointer-events-none disabled:opacity-45',
].join(' ');

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { className, page, pageCount, onPageChange, siblingCount = 1, label = 'Pagination', ...props },
  ref,
) {
  if (pageCount <= 1) return null;

  const current = Math.min(Math.max(page, 1), pageCount);
  const items = buildRange(current, pageCount, siblingCount);

  return (
    <nav ref={ref} aria-label={label} className={cn('flex items-center gap-1.5', className)} {...props}>
      <button
        type="button"
        className={cn(pageButton, 'border-border bg-bg text-text hover:border-brand-blue hover:text-brand-blue')}
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
      >
        <span aria-hidden>&larr;</span>
        <span className="sr-only">Previous page</span>
      </button>

      {items.map((item, i) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            aria-current={item === current ? 'page' : undefined}
            aria-label={`Page ${item}`}
            className={cn(
              pageButton,
              item === current
                ? 'border-brand-blue bg-brand-blue text-white'
                : 'border-border bg-bg text-text hover:border-brand-blue hover:text-brand-blue',
            )}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ) : (
          <span key={`${item}-${i}`} aria-hidden className="px-1 text-sm text-text-muted">
            &hellip;
          </span>
        ),
      )}

      <button
        type="button"
        className={cn(pageButton, 'border-border bg-bg text-text hover:border-brand-blue hover:text-brand-blue')}
        onClick={() => onPageChange(current + 1)}
        disabled={current === pageCount}
      >
        <span aria-hidden>&rarr;</span>
        <span className="sr-only">Next page</span>
      </button>
    </nav>
  );
});
