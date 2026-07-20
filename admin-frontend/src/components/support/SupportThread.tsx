'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Select, Spinner, cn } from '@haizo/ui';
import type { AdminSupportSession, SupportMessage, UpdateSupportSession } from '@haizo/types';
import { api, ApiError } from '../../lib/api';
import { useSocketEvent } from '../../lib/socket';

const STATUSES = ['OPEN', 'PENDING', 'RESOLVED'] as const;

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function merge(history: SupportMessage[], live: SupportMessage[]): SupportMessage[] {
  const byId = new Map<string, SupportMessage>();
  for (const m of history) byId.set(m.id, m);
  for (const m of live) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function SupportThread({ session }: { session: AdminSupportSession }) {
  const id = session.id;
  const qc = useQueryClient();
  const [live, setLive] = React.useState<SupportMessage[]>([]);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setLive([]);
    setDraft('');
    setError(null);
  }, [id]);

  const detail = useQuery({
    queryKey: ['support', 'session', id],
    queryFn: () => api.support.session(id),
  });
  const staff = useQuery({ queryKey: ['users', 'list'], queryFn: () => api.users.list() });

  const messages = React.useMemo(
    () => merge(detail.data?.messages ?? [], live),
    [detail.data, live],
  );

  useSocketEvent<SupportMessage>('support:message', (m) => {
    if (m.sessionId === id) setLive((prev) => [...prev, m]);
  });

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const update = useMutation({
    mutationFn: (input: UpdateSupportSession) => api.support.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support', 'sessions'] });
      qc.invalidateQueries({ queryKey: ['support', 'session', id] });
    },
  });

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const msg = await api.support.reply(id, body, crypto.randomUUID());
      setLive((prev) => [...prev, msg]);
      setDraft('');
      qc.invalidateQueries({ queryKey: ['support', 'sessions'] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send. Try again.');
    } finally {
      setSending(false);
    }
  }

  const visitorLabel = session.visitor.name || session.visitor.email || 'Anonymous visitor';

  return (
    <div className="flex h-full min-w-0 flex-col">
      {/* Header + controls */}
      <div className="border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar size="xs" name={visitorLabel} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-text-strong">{visitorLabel}</p>
            {session.visitor.email ? (
              <p className="truncate text-xs text-text-muted">{session.visitor.email}</p>
            ) : (
              <p className="text-xs text-text-muted">No contact details</p>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Select
            value={session.status}
            onChange={(e) => update.mutate({ status: e.target.value as UpdateSupportSession['status'] })}
            aria-label="Status"
            className="h-8 w-auto text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0] + s.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
          <Select
            value={session.assignee?.id ?? ''}
            onChange={(e) => update.mutate({ assigneeId: e.target.value || null })}
            aria-label="Assignee"
            className="h-8 w-auto text-sm"
          >
            <option value="">Unassigned</option>
            {(staff.data?.data ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {detail.isLoading ? (
          <div className="grid h-full place-items-center">
            <Spinner className="size-5 text-brand-blue" />
          </div>
        ) : (
          <>
            {messages.map((m) => {
              const staffMsg = m.from === 'staff';
              return (
                <div key={m.id} className={cn('mt-3 flex flex-col', staffMsg ? 'items-end' : 'items-start')}>
                  {staffMsg && m.staffName ? (
                    <span className="mb-0.5 px-1 text-[0.6875rem] font-semibold text-text-strong">{m.staffName}</span>
                  ) : null}
                  <div
                    className={cn(
                      'max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm',
                      staffMsg ? 'rounded-tr-sm bg-brand-blue text-white' : 'rounded-tl-sm bg-bg-tint text-text-strong',
                    )}
                  >
                    {m.body}
                  </div>
                  <span className="mt-0.5 px-1 text-[0.625rem] text-text-muted">{clock(m.createdAt)}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Reply */}
      <form onSubmit={send} className="border-t border-border p-3">
        {error ? <p className="mb-2 px-1 text-xs text-danger">{error}</p> : null}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(e);
              }
            }}
            rows={1}
            placeholder="Reply to the visitor…"
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-token border border-border bg-card px-3.5 py-2.5 text-sm text-text-strong outline-none placeholder:text-text-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          />
          <Button type="submit" loading={sending} disabled={!draft.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
