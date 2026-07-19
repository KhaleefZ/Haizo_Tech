import Link from 'next/link';
import { api } from '@/lib/api';
import { RotatingHeadline } from '@/components/RotatingHeadline';
import { Marquee } from '@/components/Marquee';
import { IndustryBand } from '@/components/IndustryBand';
import { ProcessTimeline } from '@/components/ProcessTimeline';
import { Reveal } from '@/components/Reveal';

export default async function Home() {
  // Fetched in parallel — three sequential awaits would triple time-to-first-byte.
  const [services, industries, testimonials] = await Promise.all([
    api.services(),
    api.industries(),
    api.testimonials(),
  ]);

  const serviceNames = (services?.data ?? []).map((s) => s.title);

  return (
    <main id="main">
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-hero-wash" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="text-overline uppercase text-brand-blue">
            Coimbatore-based software services agency
          </p>
          <RotatingHeadline items={serviceNames.length ? serviceNames : ['custom software.']} />
          <p className="mt-6 max-w-[60ch] text-body-lg text-text">
            We&rsquo;re a software services team that designs, builds and ships the systems
            businesses run on — with senior engineering, plain-English delivery, and no
            handover you can&rsquo;t take over.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-token bg-brand-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-blue-600">
              Start a Project
            </Link>
            <Link href="/services" className="rounded-token border border-border px-5 py-3 font-semibold text-brand-blue transition-colors hover:border-brand-blue hover:bg-bg-tint">
              What we do
            </Link>
          </div>
        </div>
      </section>

      <Marquee items={serviceNames} />

      <IndustryBand industries={industries?.data ?? []} />

      <section className="bg-bg-tint py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <p className="text-overline uppercase text-brand-blue">Process</p>
            <h2 className="mt-3 text-h2">Development process</h2>
            <p className="mt-3 max-w-[60ch] text-body-lg text-text-muted">
              The same four steps on every engagement, whether it&rsquo;s a six-week build or a
              long-running retainer.
            </p>
          </Reveal>
          <ProcessTimeline />
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <p className="text-overline uppercase text-brand-blue">Client feedback</p>
            <h2 className="mt-3 text-h2">Real quotes only</h2>
          </Reveal>

          {testimonials?.data.length ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {testimonials.data.map((t) => (
                <figure key={t.id} className="rounded-token border border-border bg-card p-6 shadow-card">
                  <blockquote className="text-body-lg text-text-strong">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-bg-tint-2 font-semibold text-brand-blue">
                      {t.author.charAt(0)}
                    </span>
                    <span>
                      <span className="block font-semibold text-text-strong">{t.author}</span>
                      <span className="block text-sm text-text-muted">
                        {[t.role, t.company].filter(Boolean).join(', ')}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            /* Deliberate empty state. A testimonial cannot be published without a
               sourceUrl and verifiedAt, so an unverifiable quote shows nothing at
               all rather than being quietly rendered. */
            <div className="mt-8 rounded-token border border-dashed border-border bg-bg-tint p-10 text-center">
              <p className="font-display text-h4 text-text-strong">No verified quotes published yet</p>
              <p className="mx-auto mt-2 max-w-[44ch] text-sm text-text-muted">
                A testimonial only appears here once it carries a source and a verification
                date. An honest gap beats invented praise.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-token bg-hero-gradient p-12 text-center text-white">
            <h2 className="text-h2 text-white">Ready to build something real?</h2>
            <p className="mt-3 text-body-lg text-white/85">
              Tell us the problem. We&rsquo;ll tell you honestly whether we&rsquo;re the right team for it.
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
