'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from './lib/cn';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Rendered right-aligned under the content. */
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Set false for destructive confirmations that need a deliberate choice. */
  closeOnOverlayClick?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<DialogProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  className,
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const baseId = React.useId();
  const [mounted, setMounted] = React.useState(false);

  const [entered, setEntered] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Entrance is driven by a class flip rather than @keyframes, so this package
  // stays self-contained and the global reduced-motion floor still applies.
  React.useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Remember what had focus, move focus in, and put it back on close.
  React.useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel) {
      const first = focusable(panel)[0];
      (first ?? panel).focus();
    }

    return () => {
      triggerRef.current?.focus?.();
    };
  }, [open]);

  // Lock body scroll, compensating for the scrollbar so the page doesn't shift.
  React.useEffect(() => {
    if (!open) return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const gap = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [open]);

  // Escape to close, Tab cycles within the panel.
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const items = focusable(panel);
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const titleId = `${baseId}-title`;
  const descriptionId = description ? `${baseId}-description` : undefined;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        aria-hidden
        onClick={closeOnOverlayClick ? onClose : undefined}
        className={cn(
          'absolute inset-0 bg-brand-navy/45 transition-opacity duration-200 ease-[var(--ease-out-soft)]',
          entered ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex w-full flex-col bg-card border border-border rounded-token shadow-lift',
          // Never exceed the viewport — a tall form scrolls its own body rather
          // than pushing the header and footer off-screen.
          'max-h-[90vh]',
          'transition-[opacity,transform] duration-200 ease-[var(--ease-out-soft)]',
          entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
          sizeClasses[size],
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-h4">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-text-muted">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={cn(
              'grid size-9 shrink-0 cursor-pointer place-items-center rounded-[9px]',
              'border border-transparent bg-transparent text-text',
              'transition-colors duration-150 hover:border-border hover:bg-bg-tint',
            )}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-4">
              <path
                d="m5 5 10 10M15 5 5 15"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {children ? <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div> : null}

        {footer ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-border px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
