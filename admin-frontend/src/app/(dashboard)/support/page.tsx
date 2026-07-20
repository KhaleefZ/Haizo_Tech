'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Badge, EmptyState, Spinner, cn } from '@haizo/ui';
import type { AdminSupportSession } from '@haizo/types';
import { api } from '../../../lib/api';
import { useSocketEvent } from '../../../lib/socket';
import { SupportThread } from '../../../components/support/SupportThread';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'RESOLVED', label: 'Resolved' },
] as const;

const STATUS_VARIANT: Record<string, 'danger' | 'warning' | 'success'> = {
  OPEN: 'danger',
  PENDING: 'warning',
  RESOLVED: 'success',
};

function relTime(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function SupportPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = React.useState<string>('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const sessions = useQuery({
    queryKey: ['support', 'sessions', filter],
    queryFn: () => api.support.sessions(filter || undefined),
    refetchInterval: 30_000,
  });

  const invalidateAll = React.useCallback(() => {
    qc.invalidateQueries({ queryKey: ['support', 'sessions'] });
  }, [qc]);

  // Any support traffic refreshes the inbox.
  useSocketEvent('support:message', invalidateAll);
  useSocketEvent('support:new', invalidateAll);
  useSocketEvent('support:session-updated', invalidateAll);

  const items = sessions.data?.data ?? [];
  React.useEffect(() => {
    if (!selectedId && items.length > 0) setSelectedId(items[0]!.id);
  }, [items, selectedId]);

  const selected = items.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h1 className="font-heading text-2xl font-bold text-text-strong">Support</h1>
        <p className="mt-1 text-sm text-text-muted">Live chat from visitors on the public site.</p>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-token border border-border bg-card">
        {/* Session list */}
        <aside className="flex w-80 shrink-0 flex-col border-r border-border">
          <div className="flex gap-1 border-b border-border p-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-token px-2.5 py-1 text-xs font-medium transition-colors',
                  filter === f.key ? 'bg-bg-tint-2 text-brand-blue' : 'text-text-muted hover:bg-bg-tint',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {sessions.isLoading ? (
              <div className="grid place-items-center py-10">
                <Spinner className="size-5 text-brand-blue" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-text-muted">No conversations here.</p>
            ) : (
              <ul>
                {items.map((s: AdminSupportSession) => {
                  const active = s.id === selectedId;
                  const label = s.visitor.name || s.visitor.email || 'Anonymous visitor';
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setSelectedId(s.id)}
                        className={cn(
                          'flex w-full items-start gap-3 border-b border-border px-3 py-3 text-left transition-colors',
                          active ? 'bg-bg-tint-2' : 'hover:bg-bg-tint',
                        )}
                      >
                        <Avatar size="xs" name={label} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-text-strong">{label}</span>
                            <span className="shrink-0 text-[0.6875rem] text-text-muted">{relTime(s.updatedAt)}</span>
                          </div>
                          <p className="truncate text-xs text-text-muted">
                            {s.lastMessage ? s.lastMessage.body : 'No messages yet'}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant={STATUS_VARIANT[s.status] ?? 'neutral'}>{s.status.toLowerCase()}</Badge>
                            {s.unreadCount > 0 ? (
                              <span className="grid min-w-[1.15rem] place-items-center rounded-full bg-brand-blue px-1 text-[0.625rem] font-bold text-white">
                                {s.unreadCount > 99 ? '99+' : s.unreadCount}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Thread */}
        <div className="min-w-0 flex-1">
          {selected ? (
            <SupportThread key={selected.id} session={selected} />
          ) : (
            <div className="grid h-full place-items-center p-6">
              <EmptyState
                title="No conversation selected"
                description={items.length === 0 ? 'Visitor chats will appear here.' : 'Pick a conversation from the list.'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
