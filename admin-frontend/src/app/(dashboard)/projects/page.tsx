'use client';

import * as React from 'react';
import Link from 'next/link';
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
import type { CreateProject } from '@haizo/types';
import { api } from '../../../lib/api';
import { ProjectForm } from '../../../components/projects/ProjectForm';

const KEY = ['admin', 'projects'] as const;

function statusVariant(status: string): 'success' | 'brand' | 'warning' | 'neutral' {
  const s = status.toLowerCase();
  if (s === 'active') return 'success';
  if (s === 'completed') return 'neutral';
  if (s === 'on hold') return 'warning';
  return 'brand';
}

export default function ProjectsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: KEY, queryFn: () => api.projects.list() });
  const [creating, setCreating] = React.useState(false);

  const createM = useMutation({
    mutationFn: (p: CreateProject) => api.projects.create(p),
    onSuccess: (proj) => {
      qc.invalidateQueries({ queryKey: KEY });
      setCreating(false);
      toast({ variant: 'success', title: 'Project created', description: proj.name });
    },
  });

  const rows = data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-strong">Projects</h1>
          <p className="mt-1 text-sm text-text-muted">Delivery projects and their boards.</p>
        </div>
        <Button onClick={() => setCreating(true)}>New project</Button>
      </div>

      <Card className="!p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : isError ? (
          <EmptyState title="Couldn’t load projects" description="The request failed. Try again."
            action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} />
        ) : rows.length === 0 ? (
          <EmptyState title="No projects yet" description="Create a project to start a board."
            action={<Button onClick={() => setCreating(true)}>New project</Button>} />
        ) : (
          <Table caption="Projects">
            <THead>
              <Tr>
                <Th>Project</Th>
                <Th>Client</Th>
                <Th>Status</Th>
                <Th>Progress</Th>
                <Th className="text-right">Tasks</Th>
              </Tr>
            </THead>
            <TBody>
              {rows.map((p) => (
                <Tr key={p.id}>
                  <Td strong>
                    <Link href={`/projects/${p.id}`} className="text-brand-blue hover:underline">
                      {p.name}
                    </Link>
                  </Td>
                  <Td className="text-text-muted">{p.clientName ?? '—'}</Td>
                  <Td><Badge variant={statusVariant(p.status)}>{p.status}</Badge></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-bg-tint-2">
                        <div className="h-full rounded-full bg-brand-blue" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-text-muted">{p.progress}%</span>
                    </div>
                  </Td>
                  <Td className="text-right tabular-nums text-text-muted">{p.taskCount}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Dialog open={creating} onClose={() => setCreating(false)} title="New project" size="lg" closeOnOverlayClick={false}>
        <ProjectForm onSubmit={(p) => createM.mutateAsync(p).then(() => undefined)} onCancel={() => setCreating(false)} pending={createM.isPending} />
      </Dialog>
    </div>
  );
}
