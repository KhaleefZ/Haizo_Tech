'use client';

import * as React from 'react';
import Link from 'next/link';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Spinner, cn } from '@haizo/ui';
import type { Notification } from '@haizo/types';
import { api } from '../lib/api';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const { data: count = 0 } = useQuery({
    queryKey: ['notif', 'count'],
    queryFn: () => api.notifications.unreadCount(),
    select: (d) => d.count,
    // Poll so the badge stays fresh without a socket client.
    refetchInterval: 25_000,
    refetchOnWindowFocus: true,
  });

  const list = useInfiniteQuery({
    queryKey: ['notif', 'list'],
    queryFn: ({ pageParam }) => api.notifications.list(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: open,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['notif', 'count'] });
    qc.invalidateQueries({ queryKey: ['notif', 'list'] });
  };

  const markRead = useMutation({ mutationFn: (id: string) => api.notifications.markRead(id), onSuccess: invalidate });
  const markAll = useMutation({ mutationFn: () => api.notifications.markAllRead(), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => api.notifications.remove(id), onSuccess: invalidate });

  // Close on outside click / Escape.
  React.useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items: Notification[] = list.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${count ? `, ${count} unread` : ''}`}
        className="relative grid size-9 place-items-center rounded-token text-text-muted transition-colors hover:bg-bg-tint hover:text-text-strong"
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-5">
          <path d="M10 3a4 4 0 0 0-4 4v3l-1.5 2.5h11L14 10V7a4 4 0 0 0-4-4ZM8 15a2 2 0 0 0 4 0"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[1.1rem] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-token border border-border bg-card shadow-lift sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-semibold text-text-strong">Notifications</p>
            <button
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending || count === 0}
              className="text-xs font-medium text-brand-blue hover:underline disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {list.isLoading ? (
              <div className="grid place-items-center py-10"><Spinner className="size-5 text-brand-blue" /></div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-text-muted">You’re all caught up.</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => (
                  <li key={n.id} className={cn('group relative', !n.isRead && 'bg-bg-tint-2/50')}>
                    <Link
                      href={n.url ?? '#'}
                      onClick={() => { if (!n.isRead) markRead.mutate(n.id); setOpen(false); }}
                      className="block px-4 py-3 pr-9 hover:bg-bg-tint"
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-blue" /> : <span className="mt-1.5 size-2 shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-strong">{n.title}</p>
                          <p className="truncate text-sm text-text-muted">{n.message}</p>
                          <p className="mt-0.5 text-xs text-text-muted">{relativeTime(n.createdAt)}</p>
                        </div>
                      </div>
                    </Link>
                    <button
                      aria-label="Dismiss"
                      onClick={() => remove.mutate(n.id)}
                      className="absolute right-2 top-3 hidden size-6 place-items-center rounded text-text-muted hover:bg-bg-tint hover:text-danger group-hover:grid"
                    >
                      <svg viewBox="0 0 20 20" fill="none" className="size-3.5"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {list.hasNextPage ? (
              <button
                onClick={() => list.fetchNextPage()}
                disabled={list.isFetchingNextPage}
                className="w-full border-t border-border py-2.5 text-sm font-medium text-brand-blue hover:bg-bg-tint disabled:opacity-50"
              >
                {list.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
