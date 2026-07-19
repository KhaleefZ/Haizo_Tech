'use client';

import * as React from 'react';
import { Button, Field, Input, Select, Textarea } from '@haizo/ui';
import type { AdminAnnouncement, AnnouncementAudience, CreateAnnouncement } from '@haizo/types';
import { ApiError } from '../../lib/api';

const AUDIENCES: { value: AnnouncementAudience; label: string }[] = [
  { value: 'ALL', label: 'Everyone' },
  { value: 'SUPER_ADMIN', label: 'Super admins' },
  { value: 'MANAGER', label: 'Managers' },
  { value: 'DEV', label: 'Developers' },
];

interface Props {
  initial?: AdminAnnouncement;
  onSubmit: (payload: CreateAnnouncement) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
}

export function AnnouncementForm({ initial, onSubmit, onCancel, pending }: Props) {
  const isEdit = Boolean(initial);
  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [content, setContent] = React.useState(initial?.content ?? '');
  const [audience, setAudience] = React.useState<AnnouncementAudience>(initial?.audience ?? 'ALL');
  const [formError, setFormError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await onSubmit({ title: title.trim(), content: content.trim(), audience });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <Field label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        </Field>
        <Field label="Audience">
          <Select value={audience} onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}>
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Message" required>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} required />
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
          {isEdit ? 'Save changes' : 'Post announcement'}
        </Button>
      </div>
    </form>
  );
}
