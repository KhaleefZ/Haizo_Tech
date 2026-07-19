'use client';

import * as React from 'react';
import { Button, Field, Input } from '@haizo/ui';
import type { AdminClient, CreateClient } from '@haizo/types';
import { ApiError } from '../../lib/api';

const emptyToNull = (v: string) => (v.trim() === '' ? null : v.trim());

interface Props {
  initial?: AdminClient;
  onSubmit: (payload: CreateClient) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
}

export function ClientForm({ initial, onSubmit, onCancel, pending }: Props) {
  const isEdit = Boolean(initial);
  const [organization, setOrganization] = React.useState(initial?.organization ?? '');
  const [contactName, setContactName] = React.useState(initial?.contactName ?? '');
  const [email, setEmail] = React.useState(initial?.email ?? '');
  const [formError, setFormError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await onSubmit({
        organization: organization.trim(),
        contactName: contactName.trim(),
        email: emptyToNull(email),
      });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Organization" required>
        <Input value={organization} onChange={(e) => setOrganization(e.target.value)} required maxLength={200} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name" required>
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} required maxLength={200} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} />
        </Field>
      </div>

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
          {isEdit ? 'Save changes' : 'Create client'}
        </Button>
      </div>
    </form>
  );
}
