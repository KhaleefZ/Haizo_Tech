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
import type { AdminService, CreateService } from '@haizo/types';
import { api } from '../../../lib/api';
import { ServiceForm } from '../../../components/services/ServiceForm';

const SERVICES_KEY = ['admin', 'services'] as const;

export default function ServicesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: SERVICES_KEY,
    queryFn: () => api.services.list(),
  });

  const [editing, setEditing] = React.useState<AdminService | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminService | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: SERVICES_KEY });

  const createMutation = useMutation({
    mutationFn: (payload: CreateService) => api.services.create(payload),
    onSuccess: (s) => {
      invalidate();
      setCreating(false);
      toast({ variant: 'success', title: 'Service created', description: s.title });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateService }) =>
      api.services.update(id, payload),
    onSuccess: (s) => {
      invalidate();
      setEditing(null);
      toast({ variant: 'success', title: 'Service saved', description: s.title });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.services.remove(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast({ variant: 'success', title: 'Service deleted' });
    },
    onError: () =>
      toast({ variant: 'error', title: 'Could not delete', description: 'Please try again.' }),
  });

  const rows = data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-strong">Services</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage the services shown on the marketing site.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>New service</Button>
      </div>

      <Card className="!p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            title="Couldn’t load services"
            description="The request failed. Check the API is running and try again."
            action={
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No services yet"
            description="Create your first service to show it on the marketing site."
            action={<Button onClick={() => setCreating(true)}>New service</Button>}
          />
        ) : (
          <Table caption="Services">
            <THead>
              <Tr>
                <Th>Title</Th>
                <Th>Slug</Th>
                <Th>Status</Th>
                <Th className="text-right">Order</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {rows.map((s) => (
                <Tr key={s.id}>
                  <Td strong>{s.title}</Td>
                  <Td className="font-mono text-xs text-text-muted">{s.slug}</Td>
                  <Td>
                    {s.published ? (
                      <Badge variant="success" dot>
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="neutral">Draft</Badge>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums">{s.order}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(s)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger/10"
                        onClick={() => setDeleteTarget(s)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {/* Create */}
      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="New service"
        size="lg"
        closeOnOverlayClick={false}
      >
        <ServiceForm
          onSubmit={(payload) => createMutation.mutateAsync(payload).then(() => undefined)}
          onCancel={() => setCreating(false)}
          pending={createMutation.isPending}
        />
      </Dialog>

      {/* Edit */}
      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit service"
        size="lg"
        closeOnOverlayClick={false}
      >
        {editing ? (
          <ServiceForm
            key={editing.id}
            initial={editing}
            onSubmit={(payload) =>
              updateMutation.mutateAsync({ id: editing.id, payload }).then(() => undefined)
            }
            onCancel={() => setEditing(null)}
            pending={updateMutation.isPending}
          />
        ) : null}
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete service?"
        description={
          deleteTarget ? `“${deleteTarget.title}” will be permanently removed.` : undefined
        }
        size="sm"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
