import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/Reveal';
import { StaggerHeadline } from '@/components/StaggerHeadline';
import { CONTACT } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'About',
  description:
    'An obsessively technical engineering studio in Coimbatore. We write real code, build real databases, and ship production software — and you own all of it.',
  alternates: { canonical: '/about' },
};

/**
 * The four Core Values, arranged around the central mark.
 *
 * `cell` and `numPos` are written out in full rather than composed at render
 * time — Tailwind scans source text, so an interpolated class name would never
 * be generated.
 */
const PRINCIPLES = [
  {
    n: '01',
    title: 'Engineering excellence',
    body: 'Speed is a feature. Bloated software costs money. We write clean, optimised code and deploy it to edge networks, so the internal tools your team lives in all day load instantly rather than eventually.',
    cell: 'min-[1000px]:col-start-1 min-[1000px]:row-start-1 min-[1000px]:text-right',
    numPos: '-left-[0.12em] min-[1000px]:left-auto min-[1000px]:-right-[0.12em]',
  },
  {
    n: '02',
    title: 'Data integrity first',
    body: 'Before we paint a single pixel on screen, we ensure the database schema is perfectly normalised. A beautiful interface means nothing if the data underneath it is corrupted.',
    cell: 'min-[1000px]:col-start-3 min-[1000px]:row-start-1',
    numPos: '-left-[0.12em]',
  },
  {
    n: '03',
    title: 'Absolute ownership',
    body: 'No vendor lock-in. We build on open-source technologies, and you own the code, the database and the intellectual property. If you ever want to take the system elsewhere, nothing stops you.',
    cell: 'min-[1000px]:col-start-1 min-[1000px]:row-start-2 min-[1000px]:text-right',
    numPos: '-left-[0.12em] min-[1000px]:left-auto min-[1000px]:-right-[0.12em]',
  },
  {
    n: '04',
    title: 'Transparent partnership',
    body: 'We tell you exactly what you need and what you don’t. No marketing wrappers and no fluff — a true technical partner, with our success aligned to yours.',
    cell: 'min-[1000px]:col-start-3 min-[1000px]:row-start-2',
    numPos: '-left-[0.12em]',
  },
];

const STATS = [
  {
    value: '0%',
    title: 'Offshored or outsourced',
    body: 'Every line is written by the studio. Nothing is passed to a subcontractor you never meet.',
  },
  {
    value: '24/7',
    title: 'Infrastructure support',
    body: 'The systems we ship run continuously, so the support that keeps them up does too.',
  },
  {
    value: '100%',
    title: 'Code ownership for clients',
    body: 'The repository, the database and the IP are yours. That’s the arrangement, not an upgrade.',
  },
];

const REFUSALS = [
  {
    tone: 'neutral' as const,
    label: 'Not this',
    body: 'Bloated, off-the-shelf SaaS that forces your operations to bend around its assumptions.',
  },
  {
    tone: 'neutral' as const,
    label: 'Not this',
    body: 'Fragile agency code with no schema discipline and no way for you to take it over.',
  },
  {
    tone: 'success' as const,
    label: 'This',
    body: 'Bespoke systems, normalised data, open-source foundations, and the whole thing handed to you.',
  },
];

const FOUNDERS = [
  { name: 'Gokul S', initial: 'G' },
  { name: 'Khaleefulla Z', initial: 'K' },
];

export default function AboutPage() {
  return (
    // overflow-x:clip contains the Reveal entry offset at 375px without
    // creating a scroll container.
    <main id="main" className="[overflow-x:clip]">
      {/* ============================================================= hero */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-hero-wash" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="text-overline uppercase text-brand-blue">About HaizoTech</p>
          <StaggerHeadline words={['An', 'obsessively', 'technical']} tail="engineering studio." />
          <p className="mt-6 max-w-[60ch] text-body-lg text-text">
            We write real code, build real databases, and ship production software. Not
            configured templates, not a thin layer over someone else&rsquo;s SaaS — the actual
            system your business runs on.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-token bg-brand-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-blue-600"
            >
              Start a Project
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link
              href="/services"
              className="rounded-token border border-border px-5 py-3 font-semibold text-brand-blue transition-colors hover:border-brand-blue hover:bg-bg-tint"
            >
              What we do
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================== origin story */}
      <section className="py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
          <Reveal className="min-w-0">
            <p className="text-overline uppercase text-brand-blue">Where this started</p>
            <h2 className="mt-3 text-h2">We built the alternative we wanted to hire</h2>
            <p className="mt-4 text-body-lg text-text-muted">
              HaizoTech was established in Coimbatore, India, out of dissatisfaction with how
              conventional agencies work.
            </p>
            <p className="mt-4 text-text-muted">
              We kept meeting the same two businesses. One had been fitted into a bloated,
              off-the-shelf SaaS product that almost matched how they actually operate — and
              they had reshaped the company around the software instead of the other way
              round. The other had paid a traditional agency for custom work and received
              fragile code nobody wanted to touch after handover.
            </p>
            <p className="mt-4 text-text-muted">
              Both problems have the same root: nobody was doing the engineering properly.
              So we started a studio that does.
            </p>
          </Reveal>

          <Reveal delay={80} className="min-w-0">
            <div className="overflow-hidden rounded-token border border-border bg-card shadow-card">
              <div className="flex gap-1.5 border-b border-border bg-bg-tint px-3.5 py-3" aria-hidden="true">
                <i className="h-2.5 w-2.5 rounded-full bg-border" />
                <i className="h-2.5 w-2.5 rounded-full bg-border" />
                <i className="h-2.5 w-2.5 rounded-full bg-border" />
              </div>
              <div className="p-6">
                <p className="text-overline uppercase text-brand-blue">The two things we refuse</p>
                <div className="mt-5 flex flex-col gap-4">
                  {REFUSALS.map((r) => (
                    <div key={r.body} className="flex items-start gap-3">
                      <span
                        className={`inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-overline font-semibold ${
                          r.tone === 'success'
                            ? 'bg-success/10 text-success'
                            : 'border border-border bg-bg-tint text-text-muted'
                        }`}
                      >
                        {r.tone === 'success' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                        )}
                        {r.label}
                      </span>
                      <p className="text-sm text-text">{r.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================================================ mission & vision */}
      <section className="bg-bg-tint py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="max-w-[680px]">
              <p className="text-overline uppercase text-brand-blue">Mission and vision</p>
              <h2 className="mt-3 text-h2">What we&rsquo;re for</h2>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Reveal className="min-w-0">
              <div className="h-full rounded-token border border-border bg-card p-8 shadow-card">
                <p className="text-overline uppercase text-brand-blue">Mission</p>
                <p className="mt-4 text-body-lg text-text">
                  To engineer robust, bespoke software systems that eliminate operational
                  bottlenecks, empowering businesses to scale without the constraints of
                  generic SaaS.
                </p>
              </div>
            </Reveal>
            <Reveal delay={80} className="min-w-0">
              <div className="h-full rounded-token border border-border bg-card p-8 shadow-card">
                <p className="text-overline uppercase text-brand-blue">Vision</p>
                <p className="mt-4 text-body-lg text-text">
                  To serve as the absolute technical backbone for ambitious enterprises,
                  proving that uncompromising engineering quality is the true driver of
                  sustainable growth.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ======================================================= core values
          Four numbered principles arranged two-left / two-right around a
          central mark. Below 1000px the composition collapses to a single
          left-aligned column and the mark falls to the end. */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="mx-auto mb-14 max-w-[680px] text-center">
              <p className="text-overline uppercase text-brand-blue">Core values</p>
              <h2 className="mt-3 text-h2">Four principles, applied on every engagement</h2>
              <p className="mt-3 text-body-lg text-text-muted">
                These aren&rsquo;t posters on a wall. Each one changes what happens in the
                repository.
              </p>
            </div>
          </Reveal>

          <div className="grid items-center gap-y-12 min-[1000px]:grid-cols-[1fr_auto_1fr] min-[1000px]:gap-x-14">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.n} delay={i * 80} className={`min-w-0 ${p.cell}`}>
                <div className="relative pt-5">
                  <span
                    className={`pointer-events-none absolute -top-[0.35em] select-none font-display text-[clamp(3.5rem,8vw,6rem)] font-bold leading-none tracking-[-0.04em] text-brand-blue/[0.09] ${p.numPos}`}
                    aria-hidden="true"
                  >
                    {p.n}
                  </span>
                  <h3 className="relative text-h3">{p.title}</h3>
                  <p className="relative mt-3 text-text-muted">{p.body}</p>
                </div>
              </Reveal>
            ))}

            {/* Central mark: concentric rings plus two dots orbiting at
                different speeds and directions. Transform-only, so it stays
                cheap; the global reduced-motion floor stills it. */}
            <div
              className="relative mx-auto grid h-[210px] w-[210px] place-items-center min-[1000px]:col-start-2 min-[1000px]:row-span-2 min-[1000px]:row-start-1"
              aria-hidden="true"
            >
              <span className="absolute inset-0 rounded-full border border-border" />
              <span className="absolute inset-[26px] rounded-full border border-bg-tint-2" />
              <span className="absolute inset-[52px] rounded-full border border-dashed border-border" />

              <span className="absolute inset-0 animate-spin [animation-duration:26s]">
                <i className="absolute -top-1 left-1/2 -ml-1 h-2 w-2 rounded-full bg-brand-sky" />
              </span>
              <span className="absolute inset-0 animate-spin [animation-direction:reverse] [animation-duration:40s]">
                <i className="absolute -top-[3px] left-1/2 -ml-[3px] h-1.5 w-1.5 rounded-full bg-brand-blue" />
              </span>

              <span className="z-10 grid h-[84px] w-[84px] place-items-center rounded-[20px] bg-hero-gradient text-white shadow-lift">
                <svg width="42" height="42" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
                  <ellipse cx="16" cy="16" rx="6" ry="14" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                  <path d="M2 16h28M5 8h22M5 24h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ stats */}
      <section className="bg-bg-tint py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="mx-auto mb-12 max-w-[680px] text-center">
              <p className="text-overline uppercase text-brand-blue">How we operate</p>
              <h2 className="mt-3 text-h2">Three numbers that describe the studio</h2>
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-3">
            {STATS.map((s, i) => (
              <Reveal key={s.title} delay={i * 60} className="min-w-0">
                <div className="h-full rounded-token border border-border bg-card p-8 shadow-card">
                  <p className="font-display text-[2.5rem] font-bold leading-none text-text-strong">
                    {s.value}
                  </p>
                  <h3 className="mt-3 text-h3">{s.title}</h3>
                  <p className="mt-2 text-sm text-text-muted">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= founders */}
      <section className="py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
          <Reveal className="min-w-0">
            <p className="text-overline uppercase text-brand-blue">Who runs it</p>
            <h2 className="mt-3 text-h2">Two co-founders, both hands-on</h2>
            <p className="mt-4 text-body-lg text-text-muted">
              HaizoTech was founded by two people, and both of them still work on the code.
              When you raise a technical question, it is answered by someone who built the
              thing you&rsquo;re asking about.
            </p>
            <p className="mt-4 text-text-muted">
              That&rsquo;s also why we can say what we say about ownership and transparency —
              there is no layer between the people selling the work and the people doing it.
            </p>
          </Reveal>

          <div className="grid min-w-0 gap-4">
            {FOUNDERS.map((f, i) => (
              <Reveal key={f.name} delay={i * 80} className="min-w-0">
                <div className="rounded-token border border-border bg-card p-6 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-bg-tint-2 text-sm font-semibold text-brand-blue">
                      {f.initial}
                    </span>
                    <div>
                      <p className="font-semibold text-text-strong">{f.name}</p>
                      <p className="text-sm text-text-muted">Co-founder</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================== where we are */}
      <section className="bg-bg-tint py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
          <Reveal className="min-w-0">
            <p className="text-overline uppercase text-brand-blue">Where we are</p>
            <h2 className="mt-3 text-h2">{CONTACT.city}, India</h2>
            <p className="mt-4 text-body-lg text-text-muted">
              We&rsquo;re based in {CONTACT.city} and work with businesses in India and abroad.
              If you&rsquo;d rather talk than fill in a form, the number and address below are
              the real ones.
            </p>
          </Reveal>

          <Reveal delay={80} className="min-w-0">
            <div className="rounded-token border border-border bg-card p-8 shadow-card">
              <h3 className="text-h3">Contact</h3>
              <div className="mt-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex flex-none items-center rounded-full border border-border bg-bg-tint px-2.5 py-1 text-overline font-semibold text-text-muted">
                    Office
                  </span>
                  <p className="text-sm text-text">
                    {CONTACT.city}, {CONTACT.region}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex flex-none items-center rounded-full border border-border bg-bg-tint px-2.5 py-1 text-overline font-semibold text-text-muted">
                    Phone
                  </span>
                  <p className="text-sm">
                    <a href={`tel:${CONTACT.phoneE164}`} className="text-brand-blue hover:underline">
                      {CONTACT.phoneDisplay}
                    </a>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex flex-none items-center rounded-full border border-border bg-bg-tint px-2.5 py-1 text-overline font-semibold text-text-muted">
                    Email
                  </span>
                  <p className="text-sm">
                    <a href={`mailto:${CONTACT.email}`} className="text-brand-blue hover:underline">
                      {CONTACT.email}
                    </a>
                  </p>
                </div>
              </div>
              <p className="mt-6 text-sm text-text-muted">
                Prefer to write it all down?{' '}
                <Link href="/contact" className="text-brand-blue hover:underline">
                  Use the project form
                </Link>{' '}
                instead.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========================================================= CTA band */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="rounded-token bg-hero-gradient p-12 text-center text-white">
              <h2 className="text-h2 text-white">Tell us what&rsquo;s slowing your business down</h2>
              <p className="mx-auto mt-3 max-w-[60ch] text-body-lg text-white/85">
                We&rsquo;ll tell you plainly whether it&rsquo;s a software problem, and whether
                we&rsquo;re the right team for it.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-block rounded-token bg-white px-5 py-3 font-semibold text-brand-navy transition-colors hover:bg-bg-tint"
              >
                Start a Project
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
