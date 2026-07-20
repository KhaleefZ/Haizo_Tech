'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Avatar, Badge, Button, useToast } from '@haizo/ui';
import type { CurrentUser, Role } from '@haizo/types';
import { useAuth } from '../lib/auth';
import { Icon } from '../lib/icons';
import { NotificationBell } from './NotificationBell';

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'Super admin',
  MANAGER: 'Manager',
  DEV: 'Developer',
};

export function Header({ user }: { user: CurrentUser }) {
  const { logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await logout();
      router.replace('/login');
    } catch {
      toast({ variant: 'error', title: 'Could not sign out', description: 'Please try again.' });
      setBusy(false);
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-6">
      <button
        onClick={() => document.dispatchEvent(new Event('command-palette:open'))}
        className="mr-auto flex items-center gap-2 rounded-token border border-border bg-bg-tint px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-brand-blue hover:text-text"
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-4">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
          <path d="m14 14 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-border bg-card px-1.5 text-xs sm:inline">⌘K</kbd>
      </button>
      <NotificationBell />
      <div className="mx-1 h-6 w-px bg-border" />
      <div className="flex items-center gap-3">
        <Avatar name={user.name} src={user.avatarUrl ?? undefined} className="size-8 text-xs" />
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-semibold text-text-strong">{user.name}</p>
          <p className="text-xs text-text-muted">{user.email}</p>
        </div>
        <Badge variant="neutral">{ROLE_LABEL[user.role]}</Badge>
      </div>

      <Button variant="ghost" size="sm" onClick={handleLogout} loading={busy} aria-label="Sign out">
        <Icon name="logout" className="size-[18px]" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </header>
  );
}
