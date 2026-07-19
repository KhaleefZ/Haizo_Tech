'use client';

import * as React from 'react';
import { Button, Field, Input, Textarea } from '@haizo/ui';
import type { AdminWork, CreateWork } from '@haizo/types';
import { ApiError } from '../../lib/api';
import { slugify } from '../../lib/slug';

const linesToArray = (v: string) => v.split('\n').map((s) => s.trim()).filter(Boolean);
const arrayToLines = (v: string[]) => v.join('\n');
const emptyToNull = (v: string) => (v.trim() === '' ? null : v.trim());

interface Props {
  initial?: AdminWork;
  onSubmit: (payload: CreateWork) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
}

export function WorkForm({ initial, onSubmit, onCancel, pending }: Props) {
  const isEdit = Boolean(initial);
  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [slug, setSlug] = React.useState(initial?.slug ?? '');
  const [category, setCategory] = React.useState(initial?.category ?? '');
  const [description, setDescription] = React.useState(initial?.description ?? '');
  const [imageUrls, setImageUrls] = React.useState(arrayToLines(initial?.imageUrls ?? []));
  const [liveUrl, setLiveUrl] = React.useState(initial?.liveUrl ?? '');
  const [published, setPublished] = React.useState(initial?.published ?? false);

  const [slugTouched, setSlugTouched] = React.useState(isEdit);
  React.useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const [slugError, setSlugError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSlugError(null);
    setFormError(null);
    try {
      await onSubmit({
        slug,
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        imageUrls: linesToArray(imageUrls),
        liveUrl: emptyToNull(liveUrl),
        published,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setSlugError('That slug is already taken.');
      else setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        </Field>
        <Field label="Slug" required error={slugError ?? undefined}>
          <Input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" required hint="Must match a work category.">
          <Input value={category} onChange={(e) => setCategory(e.target.value)} required maxLength={80} />
        </Field>
        <Field label="Live URL">
          <Input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} maxLength={500} placeholder="https://…" />
        </Field>
      </div>

      <Field label="Description" required>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
      </Field>

      <Field label="Image URLs" hint="One per line.">
        <Textarea value={imageUrls} onChange={(e) => setImageUrls(e.target.value)} rows={3} />
      </Field>

      <label className="flex items-center gap-2.5 rounded-token border border-border bg-bg-tint px-3.5 py-3">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="size-4 accent-brand-blue"
        />
        <span className="text-sm">
          <span className="font-semibold text-text-strong">Published</span>
          <span className="text-text-muted"> — visible on the public site</span>
        </span>
      </label>

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
          {isEdit ? 'Save changes' : 'Create work'}
        </Button>
      </div>
    </form>
  );
}
