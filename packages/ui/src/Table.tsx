import * as React from 'react';
import { cn } from './lib/cn';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Classes for the scroll container, not the <table>. */
  containerClassName?: string;
  /** Accessible name — required unless an `aria-labelledby` is passed instead. */
  caption?: React.ReactNode;
}

/**
 * Wraps the table in its own `overflow-x-auto` container so a wide table
 * scrolls itself and never forces the page to scroll sideways.
 */
export const Table = React.forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, containerClassName, caption, children, ...props },
  ref,
) {
  return (
    <div className={cn('w-full min-w-0 overflow-x-auto', containerClassName)}>
      <table
        ref={ref}
        className={cn('w-full border-collapse text-sm', className)}
        {...props}
      >
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
});

export type THeadProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const THead = React.forwardRef<HTMLTableSectionElement, THeadProps>(function THead(
  { className, ...props },
  ref,
) {
  return <thead ref={ref} className={className} {...props} />;
});

export type TBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TBody = React.forwardRef<HTMLTableSectionElement, TBodyProps>(function TBody(
  { className, ...props },
  ref,
) {
  return (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child>td]:border-b-0', className)}
      {...props}
    />
  );
});

export type TrProps = React.HTMLAttributes<HTMLTableRowElement>;

export const Tr = React.forwardRef<HTMLTableRowElement, TrProps>(function Tr(
  { className, ...props },
  ref,
) {
  return (
    <tr
      ref={ref}
      className={cn('transition-colors duration-150 hover:bg-bg-tint', className)}
      {...props}
    />
  );
});

export type ThProps = React.ThHTMLAttributes<HTMLTableCellElement>;

export const Th = React.forwardRef<HTMLTableCellElement, ThProps>(function Th(
  { className, scope = 'col', ...props },
  ref,
) {
  return (
    <th
      ref={ref}
      scope={scope}
      className={cn(
        'whitespace-nowrap border-b border-border bg-bg-tint px-4 py-3 text-left',
        'text-xs font-semibold uppercase tracking-[0.05em] text-text-muted',
        className,
      )}
      {...props}
    />
  );
});

export interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** Emphasise the primary cell in a row. */
  strong?: boolean;
}

export const Td = React.forwardRef<HTMLTableCellElement, TdProps>(function Td(
  { className, strong = false, ...props },
  ref,
) {
  return (
    <td
      ref={ref}
      className={cn(
        'border-b border-border px-4 py-3.5 align-middle text-text',
        strong && 'font-semibold text-text-strong',
        className,
      )}
      {...props}
    />
  );
});
