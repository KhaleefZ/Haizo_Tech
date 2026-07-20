'use client';

import * as React from 'react';
import { io, type Socket } from 'socket.io-client';
import type { SupportMessage } from '@haizo/types';
import {
  availability,
  getThread,
  getToken,
  postMessage,
  startSession,
  supportApiOrigin,
} from '../../lib/support';

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function SupportWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<SupportMessage[]>([]);
  const [draft, setDraft] = React.useState('');
  const [online, setOnline] = React.useState<boolean | null>(null);
  const [sending, setSending] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const socketRef = React.useRef<Socket | null>(null);
  const openRef = React.useRef(open);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  const appendMessage = React.useCallback((m: SupportMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  const connectSocket = React.useCallback(() => {
    const token = getToken();
    if (!token || socketRef.current) return;
    const s = io(supportApiOrigin, { auth: { visitorToken: token }, reconnection: true, reconnectionDelay: 500 });
    s.on('support:message', (m: SupportMessage) => {
      appendMessage(m);
      if (m.from === 'staff' && !openRef.current) setUnread((u) => u + 1);
    });
    // Catch up on reconnect (or first connect).
    s.on('connect', () => {
      void getThread().then((t) => {
        if (t) setMessages(t.messages);
      });
    });
    socketRef.current = s;
  }, [appendMessage]);

  // Opening the widget: check availability, resume any prior thread, connect.
  React.useEffect(() => {
    if (!open) return;
    setUnread(0);
    void availability().then(setOnline);
    if (getToken()) {
      void getThread().then((t) => {
        if (t) setMessages(t.messages);
      });
      connectSocket();
    }
  }, [open, connectSocket]);

  React.useEffect(
    () => () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    },
    [],
  );

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      if (!getToken()) {
        const start = await startSession({ message: body });
        setMessages(start.messages);
        connectSocket();
      } else {
        const m = await postMessage(body, crypto.randomUUID());
        appendMessage(m);
      }
      setDraft('');
    } catch {
      /* keep the draft so the visitor can retry */
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {open ? (
        <div className="flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 bg-brand-blue px-4 py-3 text-white">
            <span className="grid size-9 place-items-center rounded-full bg-white/15">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                <path d="M21 12a9 9 0 0 1-9 9 8.5 8.5 0 0 1-4-1l-5 1 1-4a9 9 0 1 1 17-5z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">Chat with us</p>
              <p className="flex items-center gap-1.5 text-xs text-white/80">
                <span className={`size-2 rounded-full ${online ? 'bg-green-400' : 'bg-white/50'}`} />
                {online === null ? 'Connecting…' : online ? 'We’re online' : 'Away — leave a message'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="grid size-8 place-items-center rounded-lg hover:bg-white/15">
              <svg viewBox="0 0 20 20" fill="none" className="size-4">
                <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-2.5 overflow-y-auto bg-bg-tint/30 px-4 py-4">
            {messages.length === 0 ? (
              <p className="mt-6 text-center text-sm text-text-muted">
                Hi 👋 Ask us anything — we usually reply within a few minutes.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.from === 'visitor';
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    {!mine && m.staffName ? (
                      <span className="mb-0.5 px-1 text-[0.6875rem] font-semibold text-text-strong">{m.staffName}</span>
                    ) : null}
                    <div
                      className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                        mine ? 'rounded-br-sm bg-brand-blue text-white' : 'rounded-bl-sm bg-card text-text-strong shadow-sm'
                      }`}
                    >
                      {m.body}
                    </div>
                    <span className="mt-0.5 px-1 text-[0.625rem] text-text-muted">{clock(m.createdAt)}</span>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <form onSubmit={send} className="border-t border-border bg-card p-2.5">
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
                placeholder="Type a message…"
                aria-label="Type a message"
                className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-text-strong outline-none placeholder:text-text-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="Send"
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-blue text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        className="relative grid size-14 place-items-center rounded-full bg-brand-blue text-white shadow-xl transition-transform hover:scale-105"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" className="size-6">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6">
            <path d="M21 12a9 9 0 0 1-9 9 8.5 8.5 0 0 1-4-1l-5 1 1-4a9 9 0 1 1 17-5z" />
          </svg>
        )}
        {!open && unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-[1.25rem] place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
    </div>
  );
}
