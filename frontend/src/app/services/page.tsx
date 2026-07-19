import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Custom software, web and mobile applications, AI systems, and network and IT solutions.',
  alternates: { canonical: '/services' },
};

const ART: Record<string, string> = {
  'custom-software-development': '/img/service-custom-software.svg',
  'web-mobile-application-development': '/img/service-web-mobile.svg',
  'ai-systems-integrations': '/img/service-ai-systems.svg',
  'network-services-it-solutions': '/img/service-network-it.svg',
};

export default async function ServicesPage() {
  const services = await api.services();
  const list = services?.data ?? [];

  return (
    <main id="main">
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 bg-hero-wash" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="text-overline uppercase text-brand-blue">Services</p>
          <h1 className="mt-4 max-w-[18ch] text-display">Four practices we can show you shipped</h1>
          <p className="mt-6 max-w-[58ch] text-body-lg text-text">
            Each one is something we&rsquo;ve delivered end to end for a paying client — what you
            get, what we build it with, and how long it usually takes.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        {list.map((s, i) => {
          const flip = i % 2 === 1;
          return (
            <article
              key={s.id}
              className={`grid items-center gap-10 border-t border-border py-16 first:border-t-0 md:grid-cols-2 ${flip ? '[&>*:first-child]:md:order-2' : ''}`}
            >
              <Reveal className="min-w-0">
                <p className="font-display text-5xl font-bold leading-none text-bg-tint-2" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h2 className="mt-3 text-h2">{s.title}</h2>
                <p className="mt-4 text-text-muted">{s.summary}</p>

                {s.deliverables.length > 0 && (
                  <ul className="mt-6 flex flex-col gap-2">
                    {s.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2.5 text-sm">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none text-brand-blue" aria-hidden="true">
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

                <Link href={`/services/${s.slug}`} className="mt-6 inline-block font-semibold text-brand-blue hover:text-brand-blue-600">
                  How we approach this &rarr;
                </Link>
              </Reveal>

              <Reveal delay={80} className="min-w-0">
                <div className="group overflow-hidden rounded-token border border-border bg-bg-tint shadow-card transition-shadow hover:shadow-lift">
                  <img
                    src={ART[s.slug] ?? ART['custom-software-development']}
                    alt=""
                    aria-hidden="true"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]"
                  />
                </div>
              </Reveal>
            </article>
          );
        })}

        {list.length === 0 && (
          <p className="py-16 text-center text-text-muted">Services are being updated. Please check back shortly.</p>
        )}
      </section>
    </main>
  );
}
