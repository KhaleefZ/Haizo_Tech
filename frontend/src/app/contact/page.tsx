import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';
import { CONTACT, SOCIALS } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Tell us about your project. Email ${CONTACT.email} or call ${CONTACT.phoneDisplay}.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <main id="main">
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-overline uppercase text-brand-blue">Contact</p>
          <h1 className="mt-4 text-display">Tell us what you&rsquo;re trying to build</h1>
          <p className="mt-6 max-w-[58ch] text-body-lg text-text-muted">
            We&rsquo;ll tell you honestly whether we&rsquo;re the right team for it.
          </p>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
            <ContactForm />

            <aside className="flex flex-col gap-6">
              <div className="rounded-token border border-border bg-card p-6 shadow-card">
                <h2 className="text-h3">Reach us directly</h2>
                <dl className="mt-5 flex flex-col gap-4 text-sm">
                  <div>
                    <dt className="font-semibold text-text-strong">Email</dt>
                    <dd className="mt-1">
                      <a href={`mailto:${CONTACT.email}`} className="text-brand-blue hover:underline">{CONTACT.email}</a>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-text-strong">Phone</dt>
                    <dd className="mt-1">
                      <a href={`tel:${CONTACT.phoneE164}`} className="text-brand-blue hover:underline">{CONTACT.phoneDisplay}</a>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-text-strong">Where we are</dt>
                    <dd className="mt-1 text-text-muted">{CONTACT.city}, {CONTACT.region}, India</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-token border border-border bg-card p-6 shadow-card">
                <h2 className="text-h3">Elsewhere</h2>
                <div className="mt-5 flex flex-col gap-3">
                  {SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm font-medium text-text transition-colors hover:text-brand-blue"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-bg-tint-2 text-brand-blue">
                        <s.Icon />
                      </span>
                      {s.label}
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
