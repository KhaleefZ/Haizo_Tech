'use client';

/**
 * The protected shell. Everything under (dashboard) requires a session.
 *
 * The guard is client-side and authoritative: it asks the API who you are (via
 * useAuth → /auth/me, which transparently refreshes an expired access token) and
 * only renders the app once that resolves to a real user. An unauthenticated
 * visitor is redirected to /login. This is the right model for HttpOnly-cookie
 * auth — the token isn't readable by JS, so the server is the only thing that can
 * actually answer "is this session valid".
 */
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@haizo/ui';
import { useAuth } from '../../lib/auth';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  // First load, or the brief moment before the redirect fires: show a spinner
  // rather than flashing the shell or the login page.
  if (isLoading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="size-6 text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} />
        <main id="main" className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
