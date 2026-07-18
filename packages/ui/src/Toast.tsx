'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from './lib/cn';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  /** Milliseconds; `0` keeps it until dismissed. */
  duration?: number;
}

export interface ToastRecord extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast() must be used inside a <ToastProvider>.');
  return ctx;
}

const variantClasses: Record<ToastVariant, string> = {
  info: 'border-border',
  success: 'border-l-4 border-l-success',
  warning: 'border-l-4 border-l-warning',
  error: 'border-l-4 border-l-danger',
};

export interface ToastProviderProps {
  children: React.ReactNode;
  /** Default auto-dismiss for toasts that don't set their own. */
  duration?: number;
  max?: number;
}

export function ToastProvider({ children, duration = 5000, max = 4 }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const counter = React.useRef(0);

  React.useEffect(() => setMounted(true), []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (options: ToastOptions) => {
      counter.current += 1;
      const id = `toast-${counter.current}`;
      setToasts((current) => [...current, { id, ...options }].slice(-max));
      return id;
    },
    [max],
  );

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div
              className={cn(
                'pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-3 p-4',
                'sm:inset-x-auto sm:right-0 sm:top-0 sm:items-end',
              )}
            >
              {toasts.map((t) => (
                <Toast
                  key={t.id}
                  toast={t}
                  defaultDuration={duration}
                  onDismiss={() => dismiss(t.id)}
                />
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

interface ToastProps {
  toast: ToastRecord;
  defaultDuration: number;
  onDismiss: () => void;
}

export function Toast({ toast, defaultDuration, onDismiss }: ToastProps) {
  const variant = toast.variant ?? 'info';
  const total = toast.duration ?? defaultDuration;
  const [paused, setPaused] = React.useState(false);
  const [entered, setEntered] = React.useState(false);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Remaining time is tracked so hovering pauses rather than restarts the clock.
  const remaining = React.useRef(total);
  const startedAt = React.useRef(Date.now());

  // Held in a ref so the provider re-rendering (which makes a fresh onDismiss)
  // can't restart the timer and stretch the toast's lifetime.
  const dismissRef = React.useRef(onDismiss);
  React.useEffect(() => {
    dismissRef.current = onDismiss;
  });

  React.useEffect(() => {
    if (total <= 0 || paused) return;

    startedAt.current = Date.now();
    const timer = setTimeout(() => dismissRef.current(), remaining.current);

    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, total]);

  return (
    <div
      // Errors interrupt; everything else is polite.
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3',
        'rounded-token border border-border bg-card p-4 shadow-lift',
        'transition-[opacity,transform] duration-200 ease-[var(--ease-out-soft)]',
        entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        variantClasses[variant],
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-strong">{toast.title}</p>
        {toast.description ? (
          <p className="mt-1 text-sm text-text-muted">{toast.description}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className={cn(
          'grid size-7 shrink-0 cursor-pointer place-items-center rounded-md',
          'text-text-muted transition-colors duration-150 hover:bg-bg-tint hover:text-text-strong',
        )}
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-3.5">
          <path
            d="m5 5 10 10M15 5 5 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
