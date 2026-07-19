'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
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
import type { AdminWorkCategory, CreateWorkCategory } from '@haizo/types';
import { api } from '../../../lib/api';
import { CategoryForm } from '../../../components/categories/CategoryForm';

const KEY = ['admin', 'categories'] as const;

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: KEY, queryFn: () => api.categories.list() });

  const [editing, setEditing] = React.useState<AdminWorkCategory | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminWorkCategory | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const createM = useMutation({
    mutationFn: (p: CreateWorkCategory) => api.categories.create(p),
    onSuccess: (r) => {
      invalidate();
      setCreating(false);
      toast({ variant: 'success', title: 'Category created', description: r.name });
    },
  });
  const updateM = useMutation({
    mutationFn: ({ id, p }: { id: string; p: CreateWorkCategory }) => api.categories.update(id, p),
    onSuccess: (r) => {
      invalidate();
      setEditing(null);
      toast({ variant: 'success', title: 'Category saved', description: r.name });
    },
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => api.categories.remove(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast({ variant: 'success', title: 'Category deleted' });
    },
    onError: () => toast({ variant: 'error', title: 'Could not delete', description: 'Please try again.' }),
  });

  const rows = data?.data ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-strong">Categories</h1>
          <p className="mt-1 text-sm text-text-muted">Work categories that drive the public filter.</p>
        </div>
        <Button onClick={() => setCreating(true)}>New category</Button>
      </div>

      <Card className="!p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            title="Couldn’t load categories"
            description="The request failed. Try again."
            action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Add a category to group your work."
            action={<Button onClick={() => setCreating(true)}>New category</Button>}
          />
        ) : (
          <Table caption="Categories">
            <THead>
              <Tr>
                <Th>Name</Th>
                <Th className="text-right">Order</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {rows.map((r) => (
                <Tr key={r.id}>
                  <Td strong>{r.name}</Td>
                  <Td className="text-right tabular-nums">{r.order}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>Edit</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger/10"
                        onClick={() => setDeleteTarget(r)}
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

      <Dialog open={creating} onClose={() => setCreating(false)} title="New category" size="sm" closeOnOverlayClick={false}>
        <CategoryForm
          onSubmit={(p) => createM.mutateAsync(p).then(() => undefined)}
          onCancel={() => setCreating(false)}
          pending={createM.isPending}
        />
      </Dialog>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit category" size="sm" closeOnOverlayClick={false}>
        {editing ? (
          <CategoryForm
            key={editing.id}
            initial={editing}
            onSubmit={(p) => updateM.mutateAsync({ id: editing.id, p }).then(() => undefined)}
            onCancel={() => setEditing(null)}
            pending={updateM.isPending}
          />
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete category?"
        description={deleteTarget ? `“${deleteTarget.name}” will be permanently removed.` : undefined}
        size="sm"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteM.isPending}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteM.isPending} onClick={() => deleteTarget && deleteM.mutate(deleteTarget.id)}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
