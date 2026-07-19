'use client';

import * as React from 'react';
import { Button, Field, Input } from '@haizo/ui';
import type { AdminWorkCategory, CreateWorkCategory } from '@haizo/types';
import { ApiError } from '../../lib/api';

interface Props {
  initial?: AdminWorkCategory;
  onSubmit: (payload: CreateWorkCategory) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
}

export function CategoryForm({ initial, onSubmit, onCancel, pending }: Props) {
  const isEdit = Boolean(initial);
  const [name, setName] = React.useState(initial?.name ?? '');
  const [order, setOrder] = React.useState(String(initial?.order ?? 0));
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setFormError(null);
    try {
      await onSubmit({ name: name.trim(), order: Number(order) || 0 });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setNameError('That name is already taken.');
      else setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Name" required error={nameError ?? undefined}>
        <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
      </Field>
      <Field label="Order" hint="Lower shows first in the public filter.">
        <Input type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} />
      </Field>

      {formError ? (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {isEdit ? 'Save changes' : 'Create category'}
        </Button>
      </div>
    </form>
  );
}
