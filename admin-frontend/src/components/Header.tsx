'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Badge, Button, useToast } from '@haizo/ui';
import type { CurrentUser, Role } from '@haizo/types';
import { useAuth } from '../lib/auth';
import { Icon } from '../lib/icons';

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'Super admin',
  MANAGER: 'Manager',
  DEV: 'Developer',
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

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
    <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-full bg-brand-blue text-xs font-semibold text-white">
          {initials(user.name)}
        </div>
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
