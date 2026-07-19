'use client';

import * as React from 'react';
import { Button, Field, Input, Textarea } from '@haizo/ui';
import type { AdminTestimonial, CreateTestimonial } from '@haizo/types';
import { ApiError } from '../../lib/api';

const emptyToNull = (v: string) => (v.trim() === '' ? null : v.trim());

interface Props {
  initial?: AdminTestimonial;
  onSubmit: (payload: CreateTestimonial) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
}

export function TestimonialForm({ initial, onSubmit, onCancel, pending }: Props) {
  const isEdit = Boolean(initial);
  const [author, setAuthor] = React.useState(initial?.author ?? '');
  const [role, setRole] = React.useState(initial?.role ?? '');
  const [company, setCompany] = React.useState(initial?.company ?? '');
  const [quote, setQuote] = React.useState(initial?.quote ?? '');
  const [avatarUrl, setAvatarUrl] = React.useState(initial?.avatarUrl ?? '');
  const [sourceUrl, setSourceUrl] = React.useState(initial?.sourceUrl ?? '');
  const [order, setOrder] = React.useState(String(initial?.order ?? 0));
  const [verified, setVerified] = React.useState(Boolean(initial?.verifiedAt));
  const [published, setPublished] = React.useState(initial?.published ?? false);

  const [errors, setErrors] = React.useState<{ sourceUrl?: string; verifiedAt?: string; form?: string }>({});

  // Publishing is only meaningful with provenance — mirror the server rule here so
  // the user gets an inline reason before the round-trip. The server enforces it
  // regardless; this is UX, not the guard.
  const canPublish = sourceUrl.trim() !== '' && verified;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (published && !canPublish) {
      setErrors({
        ...(!sourceUrl.trim() ? { sourceUrl: 'Required to publish.' } : {}),
        ...(!verified ? { verifiedAt: 'Mark the quote verified to publish.' } : {}),
        form: 'A testimonial needs a source and verification before it can be published.',
      });
      return;
    }

    const verifiedAt = verified ? initial?.verifiedAt ?? new Date().toISOString() : null;

    try {
      await onSubmit({
        author: author.trim(),
        role: emptyToNull(role),
        company: emptyToNull(company),
        quote: quote.trim(),
        avatarUrl: emptyToNull(avatarUrl),
        sourceUrl: emptyToNull(sourceUrl),
        verifiedAt,
        order: Number(order) || 0,
        published,
      });
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        const next: typeof errors = { form: 'Please fix the highlighted fields.' };
        for (const d of err.details) {
          if (d.path === 'sourceUrl') next.sourceUrl = d.message;
          if (d.path === 'verifiedAt') next.verifiedAt = d.message;
        }
        setErrors(next);
      } else {
        setErrors({ form: err instanceof Error ? err.message : 'Something went wrong.' });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Author" required>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} required maxLength={120} />
        </Field>
        <Field label="Role">
          <Input value={role} onChange={(e) => setRole(e.target.value)} maxLength={120} />
        </Field>
        <Field label="Company">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} />
        </Field>
      </div>

      <Field label="Quote" required>
        <Textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={3} required maxLength={2000} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Avatar URL">
          <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} maxLength={500} />
        </Field>
        <Field label="Order" hint="Lower shows first.">
          <Input type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} />
        </Field>
      </div>

      {/* Provenance — the fields that make publishing possible. */}
      <div className="space-y-3 rounded-token border border-border bg-bg-tint p-4">
        <p className="text-sm font-semibold text-text-strong">Provenance</p>
        <p className="text-xs text-text-muted">
          A testimonial can only be published with a source and verification. This is what keeps
          unverifiable quotes off the site.
        </p>
        <Field label="Source URL" error={errors.sourceUrl} hint="Where this quote came from (review, email thread, case study).">
          <Input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            maxLength={500}
            placeholder="https://…"
          />
        </Field>
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
            className="size-4 accent-brand-blue"
          />
          <span className="text-sm">
            <span className="font-semibold text-text-strong">Verified</span>
            <span className="text-text-muted">
              {' '}
              — I have confirmed this quote is real
              {initial?.verifiedAt ? ` (on ${new Date(initial.verifiedAt).toLocaleDateString()})` : ''}
            </span>
          </span>
        </label>
        {errors.verifiedAt ? <p className="text-sm text-danger">{errors.verifiedAt}</p> : null}
      </div>

      <label className="flex items-center gap-2.5 rounded-token border border-border bg-bg-tint px-3.5 py-3">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          disabled={!canPublish}
          className="size-4 accent-brand-blue disabled:opacity-50"
        />
        <span className="text-sm">
          <span className="font-semibold text-text-strong">Published</span>
          <span className="text-text-muted">
            {canPublish ? ' — visible on the public site' : ' — add a source and verify first'}
          </span>
        </span>
      </label>

      {errors.form ? (
        <p role="alert" className="text-sm text-danger">
          {errors.form}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {isEdit ? 'Save changes' : 'Create testimonial'}
        </Button>
      </div>
    </form>
  );
}
