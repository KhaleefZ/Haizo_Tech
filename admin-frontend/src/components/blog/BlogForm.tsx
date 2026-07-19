'use client';

import * as React from 'react';
import { Button, Field, Input, Textarea } from '@haizo/ui';
import type { AdminBlog, CreateBlog } from '@haizo/types';
import { ApiError } from '../../lib/api';
import { slugify } from '../../lib/slug';

const parseTags = (v: string) =>
  v.split(',').map((s) => s.trim()).filter(Boolean);
const emptyToNull = (v: string) => (v.trim() === '' ? null : v.trim());

interface Props {
  initial?: AdminBlog;
  onSubmit: (payload: CreateBlog) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
}

export function BlogForm({ initial, onSubmit, onCancel, pending }: Props) {
  const isEdit = Boolean(initial);
  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [slug, setSlug] = React.useState(initial?.slug ?? '');
  const [content, setContent] = React.useState(initial?.content ?? '');
  const [tags, setTags] = React.useState((initial?.tags ?? []).join(', '));
  const [imageUrl, setImageUrl] = React.useState(initial?.imageUrl ?? '');
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
        content: content.trim(),
        tags: parseTags(tags),
        imageUrl: emptyToNull(imageUrl),
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
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={250} />
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

      <Field label="Content" required hint="Markdown or plain text.">
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tags" hint="Comma-separated.">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="news, engineering" />
        </Field>
        <Field label="Cover image URL">
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} maxLength={500} placeholder="https://…" />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 rounded-token border border-border bg-bg-tint px-3.5 py-3">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="size-4 accent-brand-blue"
        />
        <span className="text-sm">
          <span className="font-semibold text-text-strong">Published</span>
          <span className="text-text-muted"> — visible on the public blog</span>
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
          {isEdit ? 'Save changes' : 'Create post'}
        </Button>
      </div>
    </form>
  );
}
