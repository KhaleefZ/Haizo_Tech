'use client';

import * as React from 'react';
import { Button, Field, Input, Textarea } from '@haizo/ui';
import type { AdminService, CreateService } from '@haizo/types';
import { ApiError } from '../../lib/api';
import { slugify } from '../../lib/slug';

/** One value per line ↔ a string[]. Empty lines are dropped. */
const linesToArray = (v: string) =>
  v
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
const arrayToLines = (v: string[]) => v.join('\n');

const emptyToNull = (v: string) => {
  const t = v.trim();
  return t === '' ? null : t;
};

interface Props {
  initial?: AdminService;
  onSubmit: (payload: CreateService) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
}

export function ServiceForm({ initial, onSubmit, onCancel, pending }: Props) {
  const isEdit = Boolean(initial);

  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [slug, setSlug] = React.useState(initial?.slug ?? '');
  const [summary, setSummary] = React.useState(initial?.summary ?? '');
  const [body, setBody] = React.useState(initial?.body ?? '');
  const [icon, setIcon] = React.useState(initial?.icon ?? '');
  const [timeline, setTimeline] = React.useState(initial?.timeline ?? '');
  const [order, setOrder] = React.useState(String(initial?.order ?? 0));
  const [stack, setStack] = React.useState(arrayToLines(initial?.stack ?? []));
  const [deliverables, setDeliverables] = React.useState(arrayToLines(initial?.deliverables ?? []));
  const [seoTitle, setSeoTitle] = React.useState(initial?.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = React.useState(initial?.seoDescription ?? '');
  const [published, setPublished] = React.useState(initial?.published ?? false);

  // On create, keep slug in step with the title until the user edits it by hand.
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

    const payload: CreateService = {
      slug,
      title: title.trim(),
      summary: summary.trim(),
      body: emptyToNull(body),
      icon: emptyToNull(icon),
      timeline: emptyToNull(timeline),
      order: Number(order) || 0,
      stack: linesToArray(stack),
      deliverables: linesToArray(deliverables),
      seoTitle: emptyToNull(seoTitle),
      seoDescription: emptyToNull(seoDescription),
      published,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSlugError('That slug is already taken.');
      } else if (err instanceof ApiError && err.details?.length) {
        // Surface the first field problem where it happened; slug inline, else general.
        const slugIssue = err.details.find((d) => d.path === 'slug');
        if (slugIssue) setSlugError(slugIssue.message);
        else setFormError(err.details.map((d) => `${d.path}: ${d.message}`).join(' · '));
      } else {
        setFormError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        </Field>
        <Field label="Slug" required error={slugError ?? undefined} hint="Used in the page URL.">
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

      <Field label="Summary" required hint="Shown on the services list and cards.">
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          required
          maxLength={400}
        />
      </Field>

      <Field label="Body" hint="Optional long-form detail for the service page.">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Icon" hint="Icon key, e.g. code.">
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={60} />
        </Field>
        <Field label="Timeline">
          <Input value={timeline} onChange={(e) => setTimeline(e.target.value)} maxLength={120} />
        </Field>
        <Field label="Order" hint="Lower shows first.">
          <Input
            type="number"
            min={0}
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tech stack" hint="One per line.">
          <Textarea value={stack} onChange={(e) => setStack(e.target.value)} rows={4} />
        </Field>
        <Field label="Deliverables" hint="One per line.">
          <Textarea
            value={deliverables}
            onChange={(e) => setDeliverables(e.target.value)}
            rows={4}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SEO title">
          <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={200} />
        </Field>
        <Field label="SEO description">
          <Input
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            maxLength={400}
          />
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
          {isEdit ? 'Save changes' : 'Create service'}
        </Button>
      </div>
    </form>
  );
}
