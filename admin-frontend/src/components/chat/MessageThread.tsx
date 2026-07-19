'use client';

import * as React from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Spinner, cn } from '@haizo/ui';
import type { ChatConversation, ChatMessage } from '@haizo/types';
import { api, ApiError } from '../../lib/api';
import { useSocketEvent } from '../../lib/socket';

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yday = new Date();
  yday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yday)) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'long', day: 'numeric' });
}

/** Merge history + live messages, de-duped by id, sorted oldest→newest. */
function mergeMessages(history: ChatMessage[], live: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const m of history) byId.set(m.id, m);
  for (const m of live) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function MessageThread({ conversation, meId }: { conversation: ChatConversation; meId: string }) {
  const convId = conversation.id;
  const qc = useQueryClient();
  const [live, setLive] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  // A fresh conversation starts with no live messages.
  React.useEffect(() => {
    setLive([]);
    setDraft('');
    setError(null);
  }, [convId]);

  const history = useInfiniteQuery({
    queryKey: ['chat', 'messages', convId],
    queryFn: ({ pageParam }) => api.chat.messages(convId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextBefore ?? undefined,
  });

  // Pages come newest-block-first (each block is ascending); reverse the blocks
  // so the oldest sits at the top of the transcript.
  const historyMessages = React.useMemo(
    () => (history.data ? [...history.data.pages].reverse().flatMap((p) => p.data) : []),
    [history.data],
  );
  const messages = React.useMemo(() => mergeMessages(historyMessages, live), [historyMessages, live]);

  // Live delivery — our own sends echo back here too, so dedupe by id handles it.
  useSocketEvent<ChatMessage>('chat:message', (msg) => {
    if (msg.conversationId === convId) setLive((prev) => [...prev, msg]);
  });

  // Keep pinned to the newest message when the count grows.
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const msg = await api.chat.post(convId, body, crypto.randomUUID());
      setLive((prev) => [...prev, msg]); // instant echo; socket copy dedupes
      setDraft('');
      qc.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send. Try again.');
    } finally {
      setSending(false);
    }
  }

  const subtitle =
    conversation.type === 'channel'
      ? `Project channel · ${conversation.members.length} member${conversation.members.length === 1 ? '' : 's'}`
      : 'Direct message';

  return (
    <div className="flex h-full min-w-0 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        <Avatar size="xs" name={conversation.title} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-text-strong">{conversation.title}</p>
          <p className="truncate text-xs text-text-muted">{subtitle}</p>
        </div>
      </div>

      {/* Transcript */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 py-4">
        {history.isLoading ? (
          <div className="grid h-full place-items-center">
            <Spinner className="size-5 text-brand-blue" />
          </div>
        ) : (
          <>
            {history.hasNextPage ? (
              <div className="mb-3 text-center">
                <button
                  onClick={() => history.fetchNextPage()}
                  disabled={history.isFetchingNextPage}
                  className="text-xs font-medium text-brand-blue hover:underline disabled:opacity-50"
                >
                  {history.isFetchingNextPage ? 'Loading…' : 'Load earlier messages'}
                </button>
              </div>
            ) : null}

            {messages.length === 0 ? (
              <p className="mt-8 text-center text-sm text-text-muted">
                No messages yet. Say hello 👋
              </p>
            ) : (
              messages.map((m, i) => {
                const prev = messages[i - 1];
                const showDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
                const mine = m.sender.id === meId;
                // Group consecutive messages from the same sender.
                const grouped = prev && prev.sender.id === m.sender.id && !showDay;
                return (
                  <React.Fragment key={m.id}>
                    {showDay ? (
                      <div className="my-3 flex items-center gap-3">
                        <span className="h-px flex-1 bg-border" />
                        <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-muted">
                          {dayLabel(m.createdAt)}
                        </span>
                        <span className="h-px flex-1 bg-border" />
                      </div>
                    ) : null}
                    <div className={cn('flex gap-2.5', grouped ? 'mt-0.5' : 'mt-3', mine && 'flex-row-reverse')}>
                      <div className="w-[26px] shrink-0">
                        {!grouped ? (
                          <Avatar size="xs" name={m.sender.name} src={m.sender.avatarUrl ?? undefined} />
                        ) : null}
                      </div>
                      <div className={cn('min-w-0 max-w-[75%]', mine && 'flex flex-col items-end')}>
                        {!grouped && !mine ? (
                          <p className="mb-0.5 text-xs font-semibold text-text-strong">{m.sender.name}</p>
                        ) : null}
                        <div
                          className={cn(
                            'whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm',
                            mine
                              ? 'rounded-tr-sm bg-brand-blue text-white'
                              : 'rounded-tl-sm bg-bg-tint text-text-strong',
                          )}
                        >
                          {m.body}
                        </div>
                        <p className="mt-0.5 text-[0.6875rem] text-text-muted">{clock(m.createdAt)}</p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Composer */}
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
            placeholder={`Message ${conversation.title}`}
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
