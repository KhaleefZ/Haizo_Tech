'use client';

import * as React from 'react';
import { Button, Field, Input, Textarea } from '@haizo/ui';
import type { AdminIndustry, CreateIndustry } from '@haizo/types';
import { ApiError } from '../../lib/api';
import { slugify } from '../../lib/slug';

const emptyToNull = (v: string) => (v.trim() === '' ? null : v.trim());

interface Props {
  initial?: AdminIndustry;
  onSubmit: (payload: CreateIndustry) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
}

export function IndustryForm({ initial, onSubmit, onCancel, pending }: Props) {
  const isEdit = Boolean(initial);
  const [name, setName] = React.useState(initial?.name ?? '');
  const [slug, setSlug] = React.useState(initial?.slug ?? '');
  const [capability, setCapability] = React.useState(initial?.capability ?? '');
  const [icon, setIcon] = React.useState(initial?.icon ?? '');
  const [order, setOrder] = React.useState(String(initial?.order ?? 0));
  const [published, setPublished] = React.useState(initial?.published ?? true);

  const [slugTouched, setSlugTouched] = React.useState(isEdit);
  React.useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const [slugError, setSlugError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSlugError(null);
    setFormError(null);
    try {
      await onSubmit({
        slug,
        name: name.trim(),
        capability: capability.trim(),
        icon: emptyToNull(icon),
        order: Number(order) || 0,
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
        <Field label="Name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
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

      <Field label="Capability" required hint="One line describing what you deliver for this industry.">
        <Textarea
          value={capability}
          onChange={(e) => setCapability(e.target.value)}
          rows={2}
          required
          maxLength={300}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Icon" hint="Icon key, e.g. heart.">
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={60} />
        </Field>
        <Field label="Order" hint="Lower shows first.">
          <Input type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} />
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
          {isEdit ? 'Save changes' : 'Create industry'}
        </Button>
      </div>
    </form>
  );
}
