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
  useToast,
} from '@haizo/ui';
import type { AdminClient, CreateClient } from '@haizo/types';
import { api } from '../../../lib/api';
import { ClientForm } from '../../../components/clients/ClientForm';

const KEY = ['admin', 'clients'] as const;

export default function ClientsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: KEY, queryFn: () => api.clients.list() });

  const [editing, setEditing] = React.useState<AdminClient | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminClient | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const createM = useMutation({
    mutationFn: (p: CreateClient) => api.clients.create(p),
    onSuccess: (r) => { invalidate(); setCreating(false); toast({ variant: 'success', title: 'Client created', description: r.organization }); },
  });
  const updateM = useMutation({
    mutationFn: ({ id, p }: { id: string; p: CreateClient }) => api.clients.update(id, p),
    onSuccess: (r) => { invalidate(); setEditing(null); toast({ variant: 'success', title: 'Client saved', description: r.organization }); },
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => api.clients.remove(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); toast({ variant: 'success', title: 'Client deleted' }); },
    onError: (err) => toast({ variant: 'error', title: 'Could not delete', description: err instanceof Error ? err.message : 'Please try again.' }),
  });

  const rows = data?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-strong">Clients</h1>
          <p className="mt-1 text-sm text-text-muted">Client organisations and their contacts.</p>
        </div>
        <Button onClick={() => setCreating(true)}>New client</Button>
      </div>

      <Card className="!p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : isError ? (
          <EmptyState title="Couldn’t load clients" description="The request failed. Try again."
            action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} />
        ) : rows.length === 0 ? (
          <EmptyState title="No clients yet" description="Add a client organisation."
            action={<Button onClick={() => setCreating(true)}>New client</Button>} />
        ) : (
          <Table caption="Clients">
            <THead>
              <Tr>
                <Th>Organization</Th>
                <Th>Contact</Th>
                <Th>Email</Th>
                <Th className="text-right">Projects</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {rows.map((c) => (
                <Tr key={c.id}>
                  <Td strong>{c.organization}</Td>
                  <Td className="text-text-muted">{c.contactName}</Td>
                  <Td className="text-text-muted">{c.email ?? '—'}</Td>
                  <Td className="text-right">
                    <Badge variant={c.projectCount ? 'brand' : 'neutral'}>{c.projectCount}</Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(c)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={() => setDeleteTarget(c)}>Delete</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Dialog open={creating} onClose={() => setCreating(false)} title="New client" size="md" closeOnOverlayClick={false}>
        <ClientForm onSubmit={(p) => createM.mutateAsync(p).then(() => undefined)} onCancel={() => setCreating(false)} pending={createM.isPending} />
      </Dialog>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit client" size="md" closeOnOverlayClick={false}>
        {editing ? (
          <ClientForm key={editing.id} initial={editing}
            onSubmit={(p) => updateM.mutateAsync({ id: editing.id, p }).then(() => undefined)}
            onCancel={() => setEditing(null)} pending={updateM.isPending} />
        ) : null}
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete client?"
        description={deleteTarget ? `“${deleteTarget.organization}” will be permanently removed.` : undefined}
        size="sm" closeOnOverlayClick={false}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteM.isPending}>Cancel</Button>
            <Button variant="danger" loading={deleteM.isPending} onClick={() => deleteTarget && deleteM.mutate(deleteTarget.id)}>Delete</Button>
          </>
        }
      />
    </div>
  );
}
