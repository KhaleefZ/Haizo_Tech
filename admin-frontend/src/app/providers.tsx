'use client';

/**
 * Client-side context stack for the whole admin: React Query (server state),
 * Toast (feedback), Auth (session). Kept in one client component so the root
 * layout can stay a server component.
 */
import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@haizo/ui';
import { AuthProvider } from '../lib/auth';

export function Providers({ children }: { children: React.ReactNode }) {
  // One client per browser session. Created in state so it survives re-renders
  // but isn't shared across requests on the server.
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
