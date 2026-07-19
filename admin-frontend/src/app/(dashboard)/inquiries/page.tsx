'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  cn,
  useToast,
} from '@haizo/ui';
import type { AdminInquiry, InquiryStatus } from '@haizo/types';
import { api } from '../../../lib/api';

const STATUSES: InquiryStatus[] = ['NEW', 'READ', 'REPLIED'];
const FILTERS: { label: string; value: InquiryStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'New', value: 'NEW' },
  { label: 'Read', value: 'READ' },
  { label: 'Replied', value: 'REPLIED' },
];

function StatusBadge({ status }: { status: InquiryStatus }) {
  if (status === 'NEW') return <Badge variant="brand" dot>New</Badge>;
  if (status === 'REPLIED') return <Badge variant="success" dot>Replied</Badge>;
  return <Badge variant="neutral">Read</Badge>;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function InquiriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = React.useState<InquiryStatus | 'ALL'>('ALL');
  const [selected, setSelected] = React.useState<AdminInquiry | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'inquiries', filter],
    queryFn: () => api.inquiries.list(filter === 'ALL' ? undefined : filter),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'inquiries'] });

  const statusM = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InquiryStatus }) =>
      api.inquiries.updateStatus(id, status),
    onSuccess: (row) => {
      invalidate();
      setSelected(row);
      toast({ variant: 'success', title: `Marked as ${row.status.toLowerCase()}` });
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => api.inquiries.remove(id),
    onSuccess: () => {
      invalidate();
      setSelected(null);
      toast({ variant: 'success', title: 'Enquiry deleted' });
    },
    onError: () => toast({ variant: 'error', title: 'Could not delete', description: 'Please try again.' }),
  });

  // Opening an unread enquiry marks it read — the natural inbox behaviour.
  function open(inq: AdminInquiry) {
    setSelected(inq);
    if (inq.status === 'NEW') statusM.mutate({ id: inq.id, status: 'READ' });
  }

  const rows = data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text-strong">Inquiries</h1>
        <p className="mt-1 text-sm text-text-muted">Contact-form leads. Opening one marks it read.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-token px-3.5 py-1.5 text-sm font-medium transition-colors',
              filter === f.value
                ? 'bg-brand-blue text-white'
                : 'bg-card text-text hover:bg-bg-tint border border-border',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="!p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : isError ? (
          <EmptyState title="Couldn’t load enquiries" description="The request failed. Try again."
            action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} />
        ) : rows.length === 0 ? (
          <EmptyState title="No enquiries" description="Leads from the contact form will appear here." />
        ) : (
          <Table caption="Inquiries">
            <THead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Interest</Th>
                <Th>Status</Th>
                <Th>Received</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {rows.map((r) => (
                <Tr key={r.id} className="cursor-pointer" onClick={() => open(r)}>
                  <Td strong>{r.name}</Td>
                  <Td className="text-text-muted">{r.email}</Td>
                  <Td className="text-text-muted">{r.service ?? '—'}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td className="whitespace-nowrap text-text-muted">{formatDate(r.submissionDate)}</Td>
                  <Td className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); open(r); }}>
                      View
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? 'Enquiry'}
        description={selected ? formatDate(selected.submissionDate) : undefined}
        size="lg"
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Email</p>
                <a href={`mailto:${selected.email}`} className="text-sm text-brand-blue hover:underline">
                  {selected.email}
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Phone</p>
                <p className="text-sm text-text">{selected.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Interest</p>
                <p className="text-sm text-text">{selected.service ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Status</p>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Message</p>
              <p className="mt-1 whitespace-pre-wrap rounded-token border border-border bg-bg-tint p-3 text-sm text-text">
                {selected.message}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap gap-2">
                {STATUSES.filter((s) => s !== selected.status).map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    loading={statusM.isPending}
                    onClick={() => statusM.mutate({ id: selected.id, status: s })}
                  >
                    Mark {s.toLowerCase()}
                  </Button>
                ))}
              </div>
              <Button
                variant="danger"
                size="sm"
                loading={deleteM.isPending}
                onClick={() => deleteM.mutate(selected.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
