import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/Reveal';
import { CONTACT } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'About',
  description:
    'An obsessively technical engineering studio in Coimbatore. We write real code, build real databases, and ship production software.',
  alternates: { canonical: '/about' },
};

/* Verbatim from haizotech.com. */
const VALUES = [
  { n: '01', title: 'Engineering Excellence', body: 'Speed is a feature. Bloated software costs money. We write clean, optimized code and deploy to edge networks so your internal tools load instantly.' },
  { n: '02', title: 'Data Integrity First', body: 'Before we paint a single pixel on screen, we ensure the database schema is perfectly normalized. Beautiful UI means nothing if the underlying data is corrupted.' },
  { n: '03', title: 'Absolute Ownership', body: 'No vendor lock-in. We build on open-source technologies and give you the keys to the kingdom. You own the code, the database, and the intellectual property.' },
  { n: '04', title: 'Transparent Partnership', body: 'No marketing wrappers, no fluff. We tell you exactly what you need and what you don\u2019t. We act as a true technical partner, aligning our success with yours.' },
];

const STATS = [
  { value: '0%', label: 'Offshored or outsourced' },
  { value: '24/7', label: 'Infrastructure support' },
  { value: '100%', label: 'Code ownership, yours' },
];

export default function AboutPage() {
  return (
    <main id="main">
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 bg-hero-wash" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6">
          <p className="text-overline uppercase text-brand-blue">About HaizoTech</p>
          <h1 className="mt-4 text-display">An obsessively technical engineering studio.</h1>
          <p className="mt-6 text-body-lg text-text">
            We write real code, build real databases, and ship production software. Not
            configured templates, not a thin layer over someone else&rsquo;s SaaS — the actual
            system your business runs on.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
          <Reveal>
            <p className="text-overline uppercase text-brand-blue">Where this started</p>
            <h2 className="mt-3 text-h2">We built the alternative we wanted to hire</h2>
            <p className="mt-4 text-text-muted">
              HaizoTech was established in Coimbatore, India, out of dissatisfaction with how
              conventional agencies work. We kept meeting the same two businesses: one fitted
              into a bloated, off-the-shelf SaaS product that almost matched how they operate,
              and one that had paid an agency for custom work and received fragile code nobody
              wanted to touch after handover.
            </p>
            <p className="mt-4 text-text-muted">
              Both problems have the same root: nobody was doing the engineering properly.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="rounded-token border border-border bg-card p-8 shadow-card">
              <h3 className="text-h3">Mission</h3>
              <p className="mt-3 text-text">
                To engineer robust, bespoke software systems that eliminate operational
                bottlenecks, empowering businesses to scale without the constraints of generic
                SaaS.
              </p>
              <h3 className="mt-8 text-h3">Vision</h3>
              <p className="mt-3 text-text">
                To serve as the absolute technical backbone for ambitious enterprises, proving
                that uncompromising engineering quality is the true driver of sustainable growth.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-bg-tint py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <p className="text-overline uppercase text-brand-blue">Core values</p>
            <h2 className="mt-3 text-h2">Four principles, applied on every engagement</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.n} delay={i * 70}>
                <div className="relative h-full rounded-token border border-border bg-card p-8 shadow-card">
                  <span className="pointer-events-none absolute right-5 top-2 font-display text-6xl font-bold leading-none text-brand-blue/[0.08]" aria-hidden="true">
                    {v.n}
                  </span>
                  <h3 className="relative text-h3">{v.title}</h3>
                  <p className="relative mt-3 text-text-muted">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 70}>
                <div className="border-l-2 border-brand-sky pl-4">
                  <p className="font-display text-3xl font-bold text-text-strong">{s.value}</p>
                  <p className="mt-1 text-sm text-text-muted">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <p className="text-overline uppercase text-brand-blue">The team</p>
            <h2 className="mt-3 text-h2">Founded by two engineers</h2>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:w-2/3">
            {['Gokul S', 'Khaleefulla Z'].map((name, i) => (
              <Reveal key={name} delay={i * 70}>
                <div className="rounded-token border border-border bg-card p-6 shadow-card">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-bg-tint-2 font-display text-lg font-semibold text-brand-blue">
                    {name.split(' ').map((p) => p[0]).join('')}
                  </span>
                  <h3 className="mt-4 text-h3">{name}</h3>
                  <p className="mt-1 text-overline uppercase tracking-[0.08em] text-brand-blue">Co-founder</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-text-muted">
            Based in {CONTACT.city}, {CONTACT.region}. Most of our clients are in India, and we
            work with teams abroad remotely.
          </p>
          <Link href="/contact" className="mt-8 inline-block rounded-token bg-brand-blue px-5 py-3 font-semibold text-white hover:bg-brand-blue-600">
            Start a conversation
          </Link>
        </div>
      </section>
    </main>
  );
}
