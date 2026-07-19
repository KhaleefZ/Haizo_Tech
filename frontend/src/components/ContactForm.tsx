'use client';

import { useState } from 'react';

const PROJECT_TYPES = [
  { value: 'custom-software', label: 'Custom software' },
  { value: 'web-mobile-apps', label: 'Web & mobile app' },
  { value: 'ai-intelligent-systems', label: 'AI systems & integrations' },
  { value: 'infrastructure-security', label: 'Network & IT solutions' },
  { value: 'not-sure', label: 'Not sure yet' },
];

const BUDGETS = [
  { value: 'under-2l', label: 'Under ₹2L' },
  { value: '2-5l', label: '₹2–5L' },
  { value: '5-15l', label: '₹5–15L' },
  { value: '15l-plus', label: '₹15L+' },
  { value: 'not-sure', label: 'Not sure yet' },
];

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

type FieldErrors = Record<string, string>;

export function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    setErrors({});

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? '') || null,
      company: String(fd.get('company') ?? '') || null,
      projectType: String(fd.get('projectType') ?? '') || null,
      budgetRange: String(fd.get('budgetRange') ?? '') || null,
      message: String(fd.get('message') ?? ''),
      consent: fd.get('consent') === 'on',
      // Honeypot. Hidden from humans; a bot that fills it gets a normal-looking
      // response and nothing is written.
      website: String(fd.get('website') ?? ''),
    };

    try {
      const res = await fetch(`${API}/v1/inquiries`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setState('sent');
        return;
      }

      const body = await res.json().catch(() => null);
      if (res.status === 429) {
        setState('error');
        setMessage('Too many enquiries from this connection. Please email us directly.');
        return;
      }
      // Map the contract's per-field details onto the inputs that produced them.
      const details: { path: string; message: string }[] = body?.error?.details ?? [];
      if (details.length) {
        setErrors(Object.fromEntries(details.map((d) => [d.path, d.message])));
        setState('idle');
        return;
      }
      setState('error');
      setMessage(body?.error?.message ?? 'Something went wrong. Please try again.');
    } catch {
      setState('error');
      setMessage('We could not reach the server. Please email us directly.');
    }
  }

  if (state === 'sent') {
    return (
      <div role="status" className="rounded-token border border-border bg-bg-tint p-8">
        <h2 className="text-h3 text-text-strong">Thanks — we have your enquiry</h2>
        <p className="mt-3 text-text-muted">
          We read every message ourselves. You will hear back from one of us, not an
          autoresponder.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {state === 'error' && (
        <p role="alert" className="rounded-token border border-danger/30 bg-danger/[0.06] p-4 text-sm text-danger">
          {message}
        </p>
      )}

      <Field label="Your name" name="name" error={errors.name} required />
      <Field label="Email" name="email" type="email" error={errors.email} required />
      <Field label="Phone (optional)" name="phone" type="tel" error={errors.phone} />
      <Field label="Company (optional)" name="company" error={errors.company} />

      <Select label="What do you need?" name="projectType" options={PROJECT_TYPES} error={errors.projectType} />
      <Select label="Budget range" name="budgetRange" options={BUDGETS} error={errors.budgetRange} />

      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-semibold text-text-strong">
          Tell us about the project
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : undefined}
          className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.5 text-text-strong outline-none focus:border-brand-blue focus:ring-[3px] focus:ring-blue-ring"
        />
        {errors.message && <p id="message-error" className="mt-2 text-sm text-danger">{errors.message}</p>}
      </div>

      {/* Honeypot — off-screen, not display:none, so bots that check visibility still fill it. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 opacity-0">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex items-start gap-2.5">
        <input id="consent" name="consent" type="checkbox" required className="mt-1" aria-describedby={errors.consent ? 'consent-error' : undefined} />
        <label htmlFor="consent" className="text-sm text-text-muted">
          I agree that HaizoTech may store these details in order to respond to my enquiry, as
          described in the <a href="/privacy" className="text-brand-blue underline">privacy policy</a>.
        </label>
      </div>
      {errors.consent && <p id="consent-error" className="text-sm text-danger">Please agree before sending.</p>}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="self-start rounded-token bg-brand-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  );
}

function Field({ label, name, type = 'text', error, required }: { label: string; name: string; type?: string; error?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-semibold text-text-strong">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.5 text-text-strong outline-none focus:border-brand-blue focus:ring-[3px] focus:ring-blue-ring"
      />
      {error && <p id={`${name}-error`} className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

function Select({ label, name, options, error }: { label: string; name: string; options: { value: string; label: string }[]; error?: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-semibold text-text-strong">{label}</label>
      <select
        id={name}
        name={name}
        defaultValue=""
        aria-invalid={Boolean(error)}
        className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.5 text-text-strong outline-none focus:border-brand-blue focus:ring-[3px] focus:ring-blue-ring"
      >
        <option value="">Select one</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
