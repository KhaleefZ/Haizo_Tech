'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Spinner, cn } from '@haizo/ui';
import type { SearchResult } from '@haizo/types';
import { api } from '../lib/api';
import { Icon, type IconName } from '../lib/icons';

const TYPE_ICON: Record<string, IconName> = {
  service: 'services',
  work: 'work',
  blog: 'blog',
  testimonial: 'testimonials',
  industry: 'industries',
  project: 'projects',
  task: 'projects',
  client: 'clients',
  inquiry: 'inquiries',
  user: 'team',
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [active, setActive] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setMounted(true), []);

  // Cmd/Ctrl-K toggles the palette from anywhere.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    // Also openable from a clickable trigger (the header search button).
    const openEvent = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    document.addEventListener('command-palette:open', openEvent);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('command-palette:open', openEvent);
    };
  }, []);

  // Reset + focus on open.
  React.useEffect(() => {
    if (open) {
      setQ('');
      setDebounced('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounce the query.
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 150);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => api.search.query(debounced),
    enabled: open && debounced.length > 0,
    staleTime: 10_000,
  });

  const results: SearchResult[] = data?.results ?? [];
  React.useEffect(() => setActive(0), [debounced]);

  function go(r: SearchResult) {
    setOpen(false);
    router.push(r.url);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); go(results[active]); }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-brand-navy/40" onClick={() => setOpen(false)} aria-hidden />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-token border border-border bg-card shadow-lift">
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <svg viewBox="0 0 20 20" fill="none" className="size-4 text-text-muted">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
            <path d="m14 14 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search services, work, projects, clients, people…"
            className="h-12 w-full bg-transparent text-sm text-text-strong outline-none placeholder:text-text-muted"
          />
          {isFetching ? <Spinner className="size-4 text-brand-blue" /> : null}
        </div>

        <div className="max-h-[22rem] overflow-y-auto p-1.5">
          {debounced.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-text-muted">Type to search across the admin.</p>
          ) : results.length === 0 && !isFetching ? (
            <p className="px-3 py-8 text-center text-sm text-text-muted">No matches for “{debounced}”.</p>
          ) : (
            <ul>
              {results.map((r, i) => (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    onClick={() => go(r)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-token px-3 py-2 text-left',
                      i === active ? 'bg-bg-tint-2' : 'hover:bg-bg-tint',
                    )}
                  >
                    <Icon name={TYPE_ICON[r.type] ?? 'dashboard'} className="size-4 shrink-0 text-text-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text-strong">{r.label}</span>
                      {r.sublabel ? <span className="block truncate text-xs text-text-muted">{r.sublabel}</span> : null}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-text-muted">{r.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-text-muted">
          <span>↑↓ to navigate · ↵ to open</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
