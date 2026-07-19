'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Dialog, EmptyState, Input, Spinner, cn } from '@haizo/ui';
import type { ChatConversation, ChatUser } from '@haizo/types';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { useSocketEvent } from '../../../lib/socket';
import { MessageThread } from '../../../components/chat/MessageThread';

function relTime(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d` : new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const CONVERSATIONS_KEY = ['chat', 'conversations'] as const;

function NewDmDialog({
  open,
  onClose,
  onOpened,
}: {
  open: boolean;
  onClose: () => void;
  onOpened: (conv: ChatConversation) => void;
}) {
  const [q, setQ] = React.useState('');
  const contacts = useQuery({
    queryKey: ['chat', 'contacts'],
    queryFn: () => api.chat.contacts(),
    enabled: open,
  });

  const openDm = useMutation({
    mutationFn: (userId: string) => api.chat.open({ userId }),
    onSuccess: (conv) => {
      onOpened(conv);
      onClose();
    },
  });

  const list = (contacts.data?.data ?? []).filter((u: ChatUser) =>
    u.name.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <Dialog open={open} onClose={onClose} title="New message">
      <div className="space-y-3">
        <Input placeholder="Search teammates" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <div className="max-h-72 overflow-y-auto">
          {contacts.isLoading ? (
            <div className="grid place-items-center py-8">
              <Spinner className="size-5 text-brand-blue" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">No teammates found.</p>
          ) : (
            <ul className="space-y-0.5">
              {list.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => openDm.mutate(u.id)}
                    disabled={openDm.isPending}
                    className="flex w-full items-center gap-3 rounded-token px-2 py-2 text-left hover:bg-bg-tint disabled:opacity-50"
                  >
                    <Avatar size="xs" name={u.name} src={u.avatarUrl ?? undefined} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text-strong">{u.name}</span>
                      <span className="block text-xs text-text-muted">{u.role.replace('_', ' ').toLowerCase()}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const conversations = useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: () => api.chat.conversations(),
    // Fallback refresh in case a socket event is missed.
    refetchInterval: 30_000,
  });

  // A new message anywhere reorders the list and updates unread counts.
  useSocketEvent('chat:message', () => {
    qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
  });

  const items = conversations.data?.data ?? [];

  // Default to the first conversation once loaded.
  React.useEffect(() => {
    if (!selectedId && items.length > 0) setSelectedId(items[0]!.id);
  }, [items, selectedId]);

  const selected = items.find((c) => c.id === selectedId) ?? null;
  const filtered = items.filter((c) => c.title.toLowerCase().includes(search.trim().toLowerCase()));

  function handleOpened(conv: ChatConversation) {
    qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    setSelectedId(conv.id);
  }

  return (
    <div className="flex h-full overflow-hidden rounded-token border border-border bg-card">
      {/* Conversation list */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-border">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Input
            placeholder="Search conversations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
          <Button size="sm" onClick={() => setDialogOpen(true)} aria-label="New message">
            New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.isLoading ? (
            <div className="grid place-items-center py-10">
              <Spinner className="size-5 text-brand-blue" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-text-muted">
              {items.length === 0 ? 'No conversations yet.' : 'No matches.'}
            </p>
          ) : (
            <ul>
              {filtered.map((c) => {
                const active = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        'flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-colors',
                        active ? 'bg-bg-tint-2' : 'hover:bg-bg-tint',
                      )}
                    >
                      <Avatar size="xs" name={c.title} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-text-strong">{c.title}</span>
                          {c.lastMessage ? (
                            <span className="shrink-0 text-[0.6875rem] text-text-muted">
                              {relTime(c.lastMessage.createdAt)}
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-text-muted">
                          {c.lastMessage ? c.lastMessage.body : 'No messages yet'}
                        </p>
                      </div>
                      {c.unreadCount > 0 ? (
                        <span className="grid min-w-[1.15rem] shrink-0 place-items-center rounded-full bg-brand-blue px-1 text-[0.625rem] font-bold text-white">
                          {c.unreadCount > 99 ? '99+' : c.unreadCount}
                        </span>
                      ) : null}
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
        {selected && user ? (
          <MessageThread key={selected.id} conversation={selected} meId={user.id} />
        ) : (
          <div className="grid h-full place-items-center p-6">
            <EmptyState
              title="No conversation selected"
              description={
                items.length === 0
                  ? 'Start a direct message with a teammate.'
                  : 'Pick a conversation from the list.'
              }
              action={<Button onClick={() => setDialogOpen(true)}>New message</Button>}
            />
          </div>
        )}
      </div>

      <NewDmDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onOpened={handleOpened} />
    </div>
  );
}
