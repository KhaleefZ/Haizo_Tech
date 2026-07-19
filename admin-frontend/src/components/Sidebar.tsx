'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@haizo/ui';
import type { CurrentUser } from '@haizo/types';
import { NAV } from '../lib/nav';
import { Icon } from '../lib/icons';
import { ChatNavBadge } from './ChatNavBadge';

function isActive(pathname: string, href: string): boolean {
  // '/' must match exactly, or it lights up on every page.
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <span className="grid size-7 place-items-center rounded-md bg-brand-blue text-white">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-4">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3 10h14M10 3c2 2.5 2 11.5 0 14M10 3c-2 2.5-2 11.5 0 14" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </span>
        <span className="font-heading text-base font-bold text-text-strong">HaizoTech</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => {
          const items = group.items.filter((i) => !i.roles || i.roles.includes(user.role));
          if (items.length === 0) return null;

          return (
            <div key={group.heading} className="mb-5">
              <p className="px-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-text-muted">
                {group.heading}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2.5 rounded-token px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-bg-tint-2 text-brand-blue'
                            : 'text-text hover:bg-bg-tint hover:text-text-strong',
                        )}
                      >
                        <Icon name={item.icon} className="size-[18px] shrink-0" />
                        {item.label}
                        {item.href === '/chat' ? <ChatNavBadge /> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
