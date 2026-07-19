'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, EmptyState, Skeleton } from '@haizo/ui';
import type { AdminActivity } from '@haizo/types';
import { api } from '../../../lib/api';

const SECTION: Record<string, string> = {
  service: '/services',
  work: '/work',
  blog: '/blog',
  testimonial: '/testimonials',
  industry: '/industries',
  category: '/categories',
  project: '/projects',
  task: '/projects',
  column: '/projects',
  client: '/clients',
  announcement: '/announcements',
  inquiry: '/inquiries',
  user: '/team',
};

function actionVariant(action: string): 'success' | 'brand' | 'danger' | 'neutral' {
  if (action === 'created') return 'success';
  if (action === 'deleted') return 'danger';
  if (action === 'updated') return 'brand';
  return 'neutral';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ActivityPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: () => api.activity.list(),
    refetchInterval: 30_000,
  });

  const rows = data?.data ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text-strong">Activity</h1>
        <p className="mt-1 text-sm text-text-muted">Every change made across the admin.</p>
      </div>

      <Card className="!p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : isError ? (
          <EmptyState title="Couldn’t load activity" description="The request failed. Try again."
            action={<button className="text-sm text-brand-blue hover:underline" onClick={() => refetch()}>Retry</button>} />
        ) : rows.length === 0 ? (
          <EmptyState title="No activity yet" description="Changes across the admin will show up here." />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((e: AdminActivity) => {
              const href = SECTION[e.entityType];
              const body = (
                <div className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0 text-sm">
                    <span className="font-semibold text-text-strong">{e.actorName ?? 'Someone'}</span>{' '}
                    <Badge variant={actionVariant(e.action)}>{e.action}</Badge>{' '}
                    <span className="text-text-muted">a {e.entityType}</span>
                    {e.entityLabel ? <span className="text-text-strong"> “{e.entityLabel}”</span> : null}
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs text-text-muted">{relativeTime(e.createdAt)}</span>
                </div>
              );
              return (
                <li key={e.id}>
                  {href ? <Link href={href} className="block hover:bg-bg-tint">{body}</Link> : body}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
