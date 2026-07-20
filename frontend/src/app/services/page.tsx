import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Reveal } from '@/components/Reveal';
import { Typewriter } from '@/components/Typewriter';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Custom software development, web and mobile applications, AI systems and integrations, and network services and IT solutions.',
  alternates: { canonical: '/services' },
};

/** Illustration + caption + the CTA wording used on the approved design. */
const PRESENTATION: Record<string, { art: string; caption: string; cta: string }> = {
  'custom-software-development': {
    art: '/img/service-custom-software.svg',
    caption: 'Layered services over one owned database.',
    cta: 'Custom software in detail',
  },
  'web-mobile-application-development': {
    art: '/img/service-web-mobile.svg',
    caption: 'One codebase, three breakpoints, consistent behaviour.',
    cta: 'How we build apps',
  },
  'ai-systems-integrations': {
    art: '/img/service-ai-systems.svg',
    caption: 'Retrieval, then generation — grounded in your data.',
    cta: 'How we approach AI work',
  },
  'network-services-it-solutions': {
    art: '/img/service-network-it.svg',
    caption: 'Redundant paths, health checks, tested failover.',
    cta: 'How we run infrastructure',
  },
};

export default async function ServicesPage() {
  const services = await api.services();
  const list = services?.data ?? [];

  return (
    <main id="main">
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-hero-wash" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="text-overline uppercase text-brand-blue">Services</p>
          <h1 className="mt-4 text-display">
            <Typewriter phrases={['What we do, done properly.']} />
          </h1>
          <p className="mt-6 max-w-[62ch] text-body-lg text-text">
            We keep the list short on purpose. Each of these is something our team has
            shipped into production and can still support afterwards — not a capability
            added to the page to look bigger.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-token bg-brand-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-blue-600">
              Start a Project
            </Link>
            <Link href="/work" className="rounded-token border border-border px-5 py-3 font-semibold text-brand-blue transition-colors hover:border-brand-blue hover:bg-bg-tint">
              See what we&rsquo;ve built
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        {list.map((s, i) => {
          const flip = i % 2 === 1;
          const p = PRESENTATION[s.slug] ?? PRESENTATION['custom-software-development']!;
          return (
            <article
              key={s.id}
              className={`grid items-center gap-10 border-t border-border py-16 first:border-t-0 md:grid-cols-2 ${flip ? '[&>*:first-child]:md:order-2' : ''}`}
            >
              <Reveal className="min-w-0">
                <p className="font-display text-5xl font-bold leading-none text-bg-tint-2" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h2 className="mt-2 text-h2">{s.title}</h2>
                <p className="mt-4 text-body-lg text-text-muted">{s.summary}</p>

                {s.deliverables.length > 0 && (
                  <ul className="mt-6 flex flex-col gap-2">
                    {s.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2.5 text-text-muted">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 flex-none text-brand-blue" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        {d}
                      </li>
                    ))}
                  </ul>
                )}

                {s.stack.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {s.stack.map((t) => (
                      <span key={t} className="rounded-full bg-bg-tint-2 px-2.5 py-1 text-overline font-semibold text-brand-blue">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <p className="mt-7">
                  <Link
                    href={`/services/${s.slug}`}
                    className="inline-flex items-center gap-2 rounded-token border border-border px-4 py-2.5 text-sm font-semibold text-brand-blue transition-colors hover:border-brand-blue hover:bg-bg-tint"
                  >
                    {p.cta}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </p>
              </Reveal>

              <Reveal delay={80} className="min-w-0">
                <figure className="group overflow-hidden rounded-token border border-border bg-bg-tint shadow-card transition-[translate,transform,box-shadow] duration-300 ease-out-soft hover:-translate-y-1 hover:shadow-lift">
                  <img
                    src={p.art}
                    alt=""
                    aria-hidden="true"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.035]"
                  />
                  <figcaption className="border-t border-border bg-card px-4 py-3 text-sm text-text-muted">
                    {p.caption}
                  </figcaption>
                </figure>
              </Reveal>
            </article>
          );
        })}

        {list.length === 0 && (
          <p className="py-16 text-center text-text-muted">Services are being updated. Please check back shortly.</p>
        )}
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-token bg-hero-gradient p-12 text-center text-white">
            <h2 className="text-h2 text-white">Not sure which of these you need?</h2>
            <p className="mt-3 text-body-lg text-white/85">
              Describe the problem and we&rsquo;ll tell you which one it is — or that it isn&rsquo;t one of them.
            </p>
            <Link href="/contact" className="mt-6 inline-block rounded-token bg-white px-5 py-3 font-semibold text-brand-navy transition-colors hover:bg-bg-tint">
              Start a Project
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
