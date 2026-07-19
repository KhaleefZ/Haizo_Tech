'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Dialog, EmptyState, Skeleton, useToast } from '@haizo/ui';
import type { AdminAnnouncement, AnnouncementAudience, CreateAnnouncement } from '@haizo/types';
import { api } from '../../../lib/api';
import { AnnouncementForm } from '../../../components/announcements/AnnouncementForm';

const KEY = ['admin', 'announcements'] as const;

const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  ALL: 'Everyone',
  SUPER_ADMIN: 'Super admins',
  MANAGER: 'Managers',
  DEV: 'Developers',
};

export default function AnnouncementsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: KEY, queryFn: () => api.announcements.list() });

  const [editing, setEditing] = React.useState<AdminAnnouncement | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminAnnouncement | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const createM = useMutation({
    mutationFn: (p: CreateAnnouncement) => api.announcements.create(p),
    onSuccess: () => { invalidate(); setCreating(false); toast({ variant: 'success', title: 'Announcement posted' }); },
  });
  const updateM = useMutation({
    mutationFn: ({ id, p }: { id: string; p: CreateAnnouncement }) => api.announcements.update(id, p),
    onSuccess: () => { invalidate(); setEditing(null); toast({ variant: 'success', title: 'Announcement saved' }); },
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => api.announcements.remove(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); toast({ variant: 'success', title: 'Announcement deleted' }); },
    onError: () => toast({ variant: 'error', title: 'Could not delete', description: 'Please try again.' }),
  });

  const rows = data?.data ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-strong">Announcements</h1>
          <p className="mt-1 text-sm text-text-muted">Internal notices for the team.</p>
        </div>
        <Button onClick={() => setCreating(true)}>New announcement</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : isError ? (
        <Card>
          <EmptyState title="Couldn’t load announcements" description="The request failed. Try again."
            action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState title="No announcements" description="Post a notice to keep the team in the loop."
            action={<Button onClick={() => setCreating(true)}>New announcement</Button>} />
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-base font-bold text-text-strong">{a.title}</h2>
                    <Badge variant={a.audience === 'ALL' ? 'neutral' : 'brand'}>{AUDIENCE_LABEL[a.audience]}</Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-text">{a.content}</p>
                  <p className="mt-3 text-xs text-text-muted">
                    {a.authorName ?? 'Someone'} · {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(a)}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={() => setDeleteTarget(a)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)} title="New announcement" size="lg" closeOnOverlayClick={false}>
        <AnnouncementForm onSubmit={(p) => createM.mutateAsync(p).then(() => undefined)} onCancel={() => setCreating(false)} pending={createM.isPending} />
      </Dialog>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit announcement" size="lg" closeOnOverlayClick={false}>
        {editing ? (
          <AnnouncementForm key={editing.id} initial={editing}
            onSubmit={(p) => updateM.mutateAsync({ id: editing.id, p }).then(() => undefined)}
            onCancel={() => setEditing(null)} pending={updateM.isPending} />
        ) : null}
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete announcement?"
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
