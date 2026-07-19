'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Field, Input, Select, Textarea } from '@haizo/ui';
import type { AdminProjectDetail, CreateProject } from '@haizo/types';
import { api, ApiError } from '../../lib/api';

const STATUSES = ['Planning', 'Active', 'On Hold', 'Completed'];
const emptyToNull = (v: string) => (v.trim() === '' ? null : v.trim());

interface Props {
  initial?: AdminProjectDetail;
  onSubmit: (payload: CreateProject) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
}

export function ProjectForm({ initial, onSubmit, onCancel, pending }: Props) {
  const isEdit = Boolean(initial);
  const [name, setName] = React.useState(initial?.name ?? '');
  const [description, setDescription] = React.useState(initial?.description ?? '');
  const [status, setStatus] = React.useState(initial?.status ?? 'Planning');
  const [clientId, setClientId] = React.useState(initial?.clientId ?? '');
  const [budget, setBudget] = React.useState(initial?.budget ?? '');
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data: clients } = useQuery({ queryKey: ['admin', 'clients'], queryFn: () => api.clients.list() });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await onSubmit({
        name: name.trim(),
        description: emptyToNull(description),
        status,
        clientId: clientId === '' ? null : clientId,
        budget: emptyToNull(budget),
      });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Name" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
      </Field>
      <Field label="Description">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Client">
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="No client">
            {(clients?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.organization}</option>
            ))}
          </Select>
        </Field>
        <Field label="Budget">
          <Input value={budget} onChange={(e) => setBudget(e.target.value)} maxLength={60} placeholder="₹ / $…" />
        </Field>
      </div>

      {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>Cancel</Button>
        <Button type="submit" loading={pending}>{isEdit ? 'Save changes' : 'Create project'}</Button>
      </div>
    </form>
  );
}
