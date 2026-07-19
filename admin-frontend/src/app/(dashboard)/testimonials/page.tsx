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
import type { AdminTestimonial, CreateTestimonial } from '@haizo/types';
import { api } from '../../../lib/api';
import { TestimonialForm } from '../../../components/testimonials/TestimonialForm';

const KEY = ['admin', 'testimonials'] as const;

export default function TestimonialsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: KEY, queryFn: () => api.testimonials.list() });

  const [editing, setEditing] = React.useState<AdminTestimonial | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminTestimonial | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const createM = useMutation({
    mutationFn: (p: CreateTestimonial) => api.testimonials.create(p),
    onSuccess: (r) => {
      invalidate();
      setCreating(false);
      toast({ variant: 'success', title: 'Testimonial created', description: r.author });
    },
  });
  const updateM = useMutation({
    mutationFn: ({ id, p }: { id: string; p: CreateTestimonial }) => api.testimonials.update(id, p),
    onSuccess: (r) => {
      invalidate();
      setEditing(null);
      toast({ variant: 'success', title: 'Testimonial saved', description: r.author });
    },
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => api.testimonials.remove(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast({ variant: 'success', title: 'Testimonial deleted' });
    },
    onError: () => toast({ variant: 'error', title: 'Could not delete', description: 'Please try again.' }),
  });

  const rows = data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-strong">Testimonials</h1>
          <p className="mt-1 text-sm text-text-muted">
            A source and verification are required before a quote can be published.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>New testimonial</Button>
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
            title="Couldn’t load testimonials"
            description="The request failed. Try again."
            action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No testimonials yet"
            description="Add a testimonial. You can save it as a draft and publish once verified."
            action={<Button onClick={() => setCreating(true)}>New testimonial</Button>}
          />
        ) : (
          <Table caption="Testimonials">
            <THead>
              <Tr>
                <Th>Author</Th>
                <Th>Quote</Th>
                <Th>Provenance</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {rows.map((r) => (
                <Tr key={r.id}>
                  <Td strong>
                    {r.author}
                    {r.company ? <span className="font-normal text-text-muted"> · {r.company}</span> : null}
                  </Td>
                  <Td className="max-w-sm truncate text-text-muted">{r.quote}</Td>
                  <Td>
                    {r.verifiedAt && r.sourceUrl ? (
                      <Badge variant="brand" dot>Verified</Badge>
                    ) : (
                      <Badge variant="warning">Unverified</Badge>
                    )}
                  </Td>
                  <Td>
                    {r.published ? (
                      <Badge variant="success" dot>Published</Badge>
                    ) : (
                      <Badge variant="neutral">Draft</Badge>
                    )}
                  </Td>
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

      <Dialog open={creating} onClose={() => setCreating(false)} title="New testimonial" size="lg" closeOnOverlayClick={false}>
        <TestimonialForm
          onSubmit={(p) => createM.mutateAsync(p).then(() => undefined)}
          onCancel={() => setCreating(false)}
          pending={createM.isPending}
        />
      </Dialog>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit testimonial" size="lg" closeOnOverlayClick={false}>
        {editing ? (
          <TestimonialForm
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
        title="Delete testimonial?"
        description={deleteTarget ? `“${deleteTarget.author}” will be permanently removed.` : undefined}
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
