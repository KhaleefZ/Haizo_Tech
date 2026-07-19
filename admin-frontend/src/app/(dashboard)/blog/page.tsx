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
import type { AdminBlog, CreateBlog } from '@haizo/types';
import { api } from '../../../lib/api';
import { BlogForm } from '../../../components/blog/BlogForm';

const KEY = ['admin', 'blog'] as const;

export default function BlogPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: KEY, queryFn: () => api.blog.list() });

  const [editing, setEditing] = React.useState<AdminBlog | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminBlog | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const createM = useMutation({
    mutationFn: (p: CreateBlog) => api.blog.create(p),
    onSuccess: (r) => {
      invalidate();
      setCreating(false);
      toast({ variant: 'success', title: 'Post created', description: r.title });
    },
  });
  const updateM = useMutation({
    mutationFn: ({ id, p }: { id: string; p: CreateBlog }) => api.blog.update(id, p),
    onSuccess: (r) => {
      invalidate();
      setEditing(null);
      toast({ variant: 'success', title: 'Post saved', description: r.title });
    },
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => api.blog.remove(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast({ variant: 'success', title: 'Post deleted' });
    },
    onError: () => toast({ variant: 'error', title: 'Could not delete', description: 'Please try again.' }),
  });

  const rows = data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-strong">Blog</h1>
          <p className="mt-1 text-sm text-text-muted">Write, edit and publish posts.</p>
        </div>
        <Button onClick={() => setCreating(true)}>New post</Button>
      </div>

      <Card className="!p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : isError ? (
          <EmptyState title="Couldn’t load posts" description="The request failed. Try again."
            action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} />
        ) : rows.length === 0 ? (
          <EmptyState title="No posts yet" description="Write your first post. Save as a draft, publish when ready."
            action={<Button onClick={() => setCreating(true)}>New post</Button>} />
        ) : (
          <Table caption="Blog">
            <THead>
              <Tr>
                <Th>Title</Th>
                <Th>Author</Th>
                <Th>Tags</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {rows.map((r) => (
                <Tr key={r.id}>
                  <Td strong>{r.title}</Td>
                  <Td className="text-text-muted">{r.authorName ?? '—'}</Td>
                  <Td className="text-text-muted">{r.tags.length ? r.tags.join(', ') : '—'}</Td>
                  <Td>
                    {r.published ? <Badge variant="success" dot>Published</Badge> : <Badge variant="neutral">Draft</Badge>}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={() => setDeleteTarget(r)}>Delete</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Dialog open={creating} onClose={() => setCreating(false)} title="New post" size="lg" closeOnOverlayClick={false}>
        <BlogForm onSubmit={(p) => createM.mutateAsync(p).then(() => undefined)} onCancel={() => setCreating(false)} pending={createM.isPending} />
      </Dialog>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit post" size="lg" closeOnOverlayClick={false}>
        {editing ? (
          <BlogForm key={editing.id} initial={editing}
            onSubmit={(p) => updateM.mutateAsync({ id: editing.id, p }).then(() => undefined)}
            onCancel={() => setEditing(null)} pending={updateM.isPending} />
        ) : null}
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete post?"
        description={deleteTarget ? `“${deleteTarget.title}” will be permanently removed.` : undefined}
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
