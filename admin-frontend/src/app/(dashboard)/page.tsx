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

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name.split(/\s+/)[0] ?? 'there';
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => api.dashboard.get() });

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
