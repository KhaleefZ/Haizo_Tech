'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSocketEvent } from '../lib/socket';

/**
 * Total unread chat messages across all conversations, shown on the Chat nav item.
 * Shares the conversations query cache with the /chat page and refreshes live on
 * incoming messages.
 */
export function ChatNavBadge() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () => api.chat.conversations(),
    refetchInterval: 30_000,
  });
  useSocketEvent('chat:message', () => qc.invalidateQueries({ queryKey: ['chat', 'conversations'] }));

  const total = (data?.data ?? []).reduce((n, c) => n + c.unreadCount, 0);
  if (!total) return null;

  return (
    <span className="ml-auto grid min-w-[1.15rem] place-items-center rounded-full bg-brand-blue px-1 text-[0.625rem] font-bold text-white">
      {total > 99 ? '99+' : total}
    </span>
  );
}
