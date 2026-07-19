'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, EmptyState, Skeleton } from '@haizo/ui';
import type { InquiryStatus } from '@haizo/types';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

function StatusBadge({ status }: { status: InquiryStatus }) {
  if (status === 'NEW') return <Badge variant="brand" dot>New</Badge>;
  if (status === 'REPLIED') return <Badge variant="success" dot>Replied</Badge>;
  return <Badge variant="neutral">Read</Badge>;
}

function TrafficChart({ daily }: { daily: { date: string; views: number }[] }) {
  const max = Math.max(1, ...daily.map((d) => d.views));
  return (
    <div>
      <div className="flex h-36 items-end gap-1.5" role="img" aria-label="Page views over the last 14 days">
        {daily.map((d) => {
          const pct = (d.views / max) * 100;
          const label = new Date(`${d.date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          return (
            <div key={d.date} className="group flex flex-1 items-end" style={{ height: '100%' }}>
              <div
                className="w-full rounded-t bg-brand-blue/75 transition-colors group-hover:bg-brand-blue"
                style={{ height: `${Math.max(pct, 2)}%` }}
                title={`${label}: ${d.views} view${d.views === 1 ? '' : 's'}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-text-muted">
        <span>{daily[0] ? new Date(`${daily[0].date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name.split(/\s+/)[0] ?? 'there';
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => api.dashboard.get() });
  const analytics = useQuery({ queryKey: ['admin', 'analytics'], queryFn: () => api.analytics.get() });

  const stats = [
    { label: 'New inquiries', value: data?.newInquiries, hint: 'awaiting triage', href: '/inquiries' },
    { label: 'Open projects', value: data?.openProjects, hint: 'in progress', href: '/projects' },
    { label: 'Published services', value: data?.publishedServices, hint: 'live on the site', href: '/services' },
    { label: 'Draft posts', value: data?.draftPosts, hint: 'unpublished', href: '/blog' },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-heading text-2xl font-bold text-text-strong">Welcome back, {firstName}</h1>
      <p className="mt-1 text-sm text-text-muted">Here’s what’s happening across HaizoTech.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="h-full transition hover:border-brand-blue hover:shadow-lift">
              <p className="text-sm font-medium text-text-muted">{s.label}</p>
              {isLoading ? (
                <Skeleton className="mt-2 h-9 w-12" />
              ) : (
                <p className="mt-2 font-heading text-3xl font-bold text-text-strong">
                  {isError ? '—' : (s.value ?? 0)}
                </p>
              )}
              <p className="mt-1 text-xs text-text-muted">{s.hint}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-text-strong">Traffic</p>
            <p className="text-xs text-text-muted">
              {analytics.data ? `${analytics.data.totalViews} views · last 14 days` : 'last 14 days'}
            </p>
          </div>
          <div className="mt-4">
            {analytics.isLoading ? (
              <Skeleton className="h-36 w-full" />
            ) : analytics.isError ? (
              <p className="py-12 text-center text-sm text-text-muted">Couldn’t load traffic.</p>
            ) : (
              <TrafficChart daily={analytics.data!.daily} />
            )}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-text-strong">Top pages</p>
          <div className="mt-4">
            {analytics.isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
            ) : (analytics.data?.topPaths.length ?? 0) === 0 ? (
              <p className="py-6 text-sm text-text-muted">No visits yet.</p>
            ) : (
              <ul className="space-y-2">
                {analytics.data!.topPaths.map((p) => (
                  <li key={p.path} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-mono text-xs text-text">{p.path}</span>
                    <span className="shrink-0 tabular-nums text-text-muted">{p.views}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4 !p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <p className="text-sm font-semibold text-text-strong">Recent inquiries</p>
          <Link href="/inquiries" className="text-sm text-brand-blue hover:underline">View all</Link>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : isError ? (
          <EmptyState title="Couldn’t load activity" description="Reload the page to try again." />
        ) : (data?.recentInquiries.length ?? 0) === 0 ? (
          <EmptyState title="No inquiries yet" description="Leads from the contact form will show here." />
        ) : (
          <ul className="divide-y divide-border">
            {data!.recentInquiries.map((inq) => (
              <li key={inq.id}>
                <Link href="/inquiries" className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-bg-tint">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-strong">{inq.name}</p>
                    <p className="truncate text-sm text-text-muted">{inq.message}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={inq.status} />
                    <span className="whitespace-nowrap text-xs text-text-muted">
                      {new Date(inq.submissionDate).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
