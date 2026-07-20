'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  Select,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useToast,
} from '@haizo/ui';
import type { AdminUser, Role } from '@haizo/types';
import { api, ApiError } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

const ROLES: { value: Role; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'DEV', label: 'Developer' },
];

export default function TeamPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user: me } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.users.list(),
  });

  const roleM = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => api.users.updateRole(id, role),
    onSuccess: (u) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ variant: 'success', title: 'Role updated', description: `${u.name} is now ${u.role.replace('_', ' ').toLowerCase()}` });
    },
    onError: (err) =>
      toast({
        variant: 'error',
        title: 'Could not change role',
        description: err instanceof ApiError ? err.message : 'Please try again.',
      }),
  });

  const rows = data?.data ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text-strong">Team</h1>
        <p className="mt-1 text-sm text-text-muted">Manage your teammates and their roles.</p>
      </div>

      <Card className="!p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : isError ? (
          <EmptyState
            title="Couldn’t load the team"
            description="Only a super admin can manage the team."
            action={<button className="text-sm text-brand-blue hover:underline" onClick={() => refetch()}>Retry</button>}
          />
        ) : (
          <Table caption="Team">
            <THead>
              <Tr>
                <Th>Member</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Joined</Th>
              </Tr>
            </THead>
            <TBody>
              {rows.map((u: AdminUser) => {
                const isSelf = u.id === me?.id;
                return (
                  <Tr key={u.id}>
                    <Td strong>
                      <span className="flex items-center gap-2.5">
                        <Avatar size="xs" name={u.name} src={u.avatarUrl ?? undefined} />
                        {u.name}
                        {isSelf ? <Badge variant="neutral">You</Badge> : null}
                      </span>
                    </Td>
                    <Td className="text-text-muted">{u.email}</Td>
                    <Td>
                      <div className="max-w-[10rem]">
                        <Select
                          value={u.role}
                          disabled={isSelf || roleM.isPending}
                          onChange={(e) => roleM.mutate({ id: u.id, role: e.target.value as Role })}
                          aria-label={`Role for ${u.name}`}
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </Select>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-text-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
