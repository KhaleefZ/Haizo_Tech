import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api, SITE_URL } from '@/lib/api';
import { slugify } from '@/lib/slug';
import { Reveal } from '@/components/Reveal';
import { PanelArt } from '@/components/PanelArt';
import { ProcessTimeline, type ProcessStep } from '@/components/ProcessTimeline';
import { Unverified, UnverifiedBanner } from '@/components/Unverified';

type Props = { params: Promise<{ slug: string }> };

/* --------------------------------------------------------------- glyphs --- */

const Glyph = {
  calendar: (
    <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18M8 14h3M14 14h2M8 17h2" />
    </svg>
  ),
  chart: (
    <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="m7 15 4-5 3 3 5-7" />
    </svg>
  ),
  register: (
    <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h7M9 11h7" />
    </svg>
  ),
  target: (
    <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  ),
  card: (
    <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  ),
};

/* ------------------------------------------------------------- narrative --- */

/**
 * Case-study narrative.
 *
 * The database has no columns for problem / approach / result yet, so the long
 * form lives here, keyed by slug and taken from the approved mockup. A work
 * with no entry falls back to its own `description` — we do not write narrative
 * for a project nobody has documented.
 *
 * Figures invented for the mockup stay wrapped in <Unverified>. They must not
 * be promoted to plain text until someone confirms them with the client and
 * removes the wrapper deliberately.
 */
type CaseNarrative = {
  badges: { label: string; tone: 'neutral' | 'brand' | 'success' }[];
  standfirst: React.ReactNode;
  /** True when any figure on the page is still unverified — drives the banner. */
  hasUnverified: boolean;
  metrics: { value: React.ReactNode; label: string }[];
  shots: { caption: string; glyph: React.ReactNode }[];
  story: {
    n: string;
    heading: string;
    body: React.ReactNode;
    caption: string;
    glyph: React.ReactNode;
  }[];
  decisionsLead: string;
  decisions: { title: string; body: string; icon: string }[];
  engagement: ProcessStep[];
  stackLead: string;
  stackGroups: { title: string; items: string[] }[];
  ctaHeading: string;
  ctaBody: string;
};

const NARRATIVE: Record<string, CaseNarrative> = {
  'sri-ask-residency': {
    badges: [
      { label: 'Hospitality', tone: 'neutral' },
      { label: 'Custom software', tone: 'brand' },
      { label: 'In production', tone: 'success' },
    ],
    hasUnverified: true,
    standfirst: (
      <>
        A working property running on a paper register and phone calls now runs on a live
        booking system. The measurable change: front-desk administration time down roughly
        40%, and the double bookings that a shared diary makes inevitable are now
        structurally impossible.
      </>
    ),
    metrics: [
      { value: '~40%', label: 'Less front-desk admin time' },
      {
        value: (
          <Unverified reason="invented for the mockup. Confirm with Sri ASK Residency before publishing.">
            0
          </Unverified>
        ),
        label: 'Double bookings since launch',
      },
      {
        value: (
          <Unverified reason="invented for the mockup. Confirm real uptime before publishing.">
            99.9%
          </Unverified>
        ),
        label: 'Uptime',
      },
      {
        value: (
          <Unverified reason="invented for the mockup. Confirm the real project duration.">
            7 wks
          </Unverified>
        ),
        label: 'Scope to production',
      },
    ],
    shots: [
      { caption: 'Availability calendar — all rooms, one month, live status.', glyph: Glyph.calendar },
      { caption: 'Occupancy and revenue reporting for the owner.', glyph: Glyph.chart },
      { caption: 'Check-in flow with payment status and guest history.', glyph: Glyph.card },
    ],
    story: [
      {
        n: '01',
        heading: 'Problem',
        caption: 'Before: one paper register, one reader at a time.',
        glyph: Glyph.register,
        body: (
          <>
            <p className="mt-4 text-text-muted">
              Sri ASK Residency was booking rooms the way most independent properties do: a
              phone call, a name written into a register, and a member of staff who knew from
              memory which rooms were free. It works until it doesn&rsquo;t. The register is a
              single physical object, so only one person can consult it at a time; two
              enquiries arriving together is enough to create a double booking.
            </p>
            <p className="mt-4 text-text-muted">
              The knock-on effects were the expensive part. Nobody could answer &ldquo;how full
              are we next weekend&rdquo; without leafing through pages. Rates varied by who took
              the call. Month-end revenue was reconstructed after the fact from receipts, which
              made it slow to produce and impossible to fully trust.
            </p>
          </>
        ),
      },
      {
        n: '02',
        heading: 'Approach',
        caption: 'Availability computed from bookings, not stored.',
        glyph: Glyph.target,
        body: (
          <>
            <p className="mt-4 text-text-muted">
              We spent the first week at the property rather than in a specification document,
              because the register encoded rules nobody had written down — which rooms are held
              for walk-ins, how long a phone booking stays unconfirmed, what happens when a
              guest extends. Those rules were the actual product; the software was the easy
              part.
            </p>
            <p className="mt-4 text-text-muted">
              The decision that shaped the build: availability is derived from bookings, never
              stored as an editable field. A room cannot be marked free while a booking exists
              against it, because &ldquo;free&rdquo; isn&rsquo;t a value anyone can set. That
              closes the double-booking class of bug at the data model rather than patching it
              in the UI.
            </p>
          </>
        ),
      },
      {
        n: '03',
        heading: 'What we built',
        caption: 'Availability calendar — all rooms, one month.',
        glyph: Glyph.calendar,
        body: (
          <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-text-muted">
            <li>
              <strong className="text-text-strong">Live availability calendar</strong> across all
              rooms, computed from bookings, visible to every staff member at once.
            </li>
            <li>
              <strong className="text-text-strong">Booking workflow</strong> covering enquiry,
              hold with expiry, confirmation, check-in, extension and check-out.
            </li>
            <li>
              <strong className="text-text-strong">Rate rules</strong> by room type, season and
              length of stay, so pricing no longer depends on who answers the phone.
            </li>
            <li>
              <strong className="text-text-strong">Payment and balance tracking</strong> per
              booking, with advances and outstanding amounts visible at check-in.
            </li>
            <li>
              <strong className="text-text-strong">Guest records</strong> with stay history, so
              returning guests are recognised rather than re-entered.
            </li>
            <li>
              <strong className="text-text-strong">Occupancy and revenue reporting</strong> for
              the owner, exportable for the accountant.
            </li>
            <li>
              <strong className="text-text-strong">Role-based access</strong> — front desk,
              manager and owner see different things, enforced on the server.
            </li>
            <li>
              <strong className="text-text-strong">Automated nightly backups</strong> with a
              restore we ran in front of the owner before handover.
            </li>
          </ul>
        ),
      },
      {
        n: '04',
        heading: 'Result',
        caption: 'Occupancy and revenue, on demand.',
        glyph: Glyph.chart,
        body: (
          <>
            <p className="mt-4 text-text-muted">
              Front-desk administration time dropped by roughly 40%, mostly because the
              questions that used to require searching the register are now answered on screen.
              There have been{' '}
              <Unverified reason="invented for the mockup. Confirm with Sri ASK Residency before publishing.">
                no double bookings since launch
              </Unverified>
              , which is a property of the design rather than a run of good luck.
            </p>
            <p className="mt-4 text-text-muted">
              The owner gets occupancy and revenue figures on demand instead of at month end.
              The system has run at{' '}
              <Unverified reason="invented for the mockup. Confirm real uptime before publishing.">
                99.9% uptime
              </Unverified>
              , and the property has since taken over day-to-day administration of it
              themselves — which was the point.
            </p>
          </>
        ),
      },
    ],
    decisionsLead:
      'Four choices shaped this system. Each one was made for a reason we could explain to the owner at the time — not a preference we defaulted to.',
    decisions: [
      {
        title: 'Availability is derived, never stored',
        icon: 'M12 2v20M2 12h20',
        body: 'A "free rooms" column would need updating from a dozen places, and any missed update becomes a double booking. Instead availability is computed from the bookings themselves, with the database rejecting overlaps outright. The property can’t be told a room is free when it isn’t — not because staff are careful, but because the data model won’t allow it.',
      },
      {
        title: 'Holds expire on their own',
        icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
        body: 'Phone enquiries need a room held before payment, and in a paper system those holds are forgotten and quietly block inventory. Every hold here carries an expiry and releases itself. Nobody has to remember to tidy up.',
      },
      {
        title: 'Roles enforced on the server',
        icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
        body: 'Front desk, manager and owner see different things — and the difference is enforced in the API, not by hiding buttons. Rate rules and revenue reporting are owner-only, so a shared front-desk machine can’t expose them.',
      },
      {
        title: 'Handover was part of the build',
        icon: 'M21 12a9 9 0 1 1-9-9c2.5 0 4.7 1 6.4 2.6L21 8M21 3v5h-5',
        body: 'We restored the database from a backup in front of the owner before we called it finished. A backup nobody has tested is a hope, not a safeguard — and the property now runs day-to-day administration without us.',
      },
    ],
    engagement: [
      {
        n: '01',
        title: 'On site first',
        body: 'We spent time at the property watching how bookings were actually taken before designing anything. Most of the awkward cases — walk-ins, extensions, part payments — never come up in a meeting.',
      },
      {
        n: '02',
        title: 'Clickable before coded',
        body: 'The front desk walked through screens they could click while it was still cheap to move things. The check-in flow changed twice at this stage and cost nothing.',
      },
      {
        n: '03',
        title: 'Built in slices',
        body: 'Bookings and availability first, since everything else depends on them, then rates, payments and reporting. Each slice went to a staging URL the owner could open.',
      },
      {
        n: '04',
        title: 'Ran alongside the register',
        body: 'For the first stretch the property kept the paper register in parallel. When the two stopped disagreeing, the paper stopped — no risky switchover day.',
      },
    ],
    stackLead:
      'Nothing exotic. A relational database with real constraints is doing most of the work here — the booking rules live in the schema, where they can’t be bypassed by a future feature.',
    stackGroups: [
      { title: 'Application', items: ['Next.js', 'React', 'TypeScript', 'Tailwind'] },
      { title: 'Data & API', items: ['Node.js', 'PostgreSQL', 'Prisma', 'OpenAPI'] },
      { title: 'Infrastructure', items: ['Linux VPS', 'Docker', 'GitHub Actions', 'Nightly backups'] },
    ],
    ctaHeading: 'Got a process still running on paper?',
    ctaBody:
      'That’s the problem we’re best at. Tell us how it works today and we’ll tell you what it would take to fix.',
  },
};

/* ------------------------------------------------------------------ page --- */

async function findWork(slug: string) {
  const works = await api.work('?pageSize=100');
  return (works?.data ?? []).find((w) => slugify(w.title) === slug) ?? null;
}

export async function generateStaticParams() {
  const works = await api.work('?pageSize=100');
  return (works?.data ?? []).map((w) => ({ slug: slugify(w.title) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const work = await findWork(slug);
  if (!work) return { title: 'Case study not found' };
  return {
    title: work.title,
    description: work.description.slice(0, 160),
    alternates: { canonical: `/work/${slug}` },
  };
}

export default async function WorkDetail({ params }: Props) {
  const { slug } = await params;

  const [works, testimonials] = await Promise.all([
    api.work('?pageSize=100'),
    api.testimonials(),
  ]);
  const all = works?.data ?? [];
  const work = all.find((w) => slugify(w.title) === slug) ?? null;
  if (!work) notFound();

  const n = NARRATIVE[slug];

  // Renders only when another published case study exists. With one work
  // published there is nothing to link to, and an empty "keep reading" that
  // goes nowhere is worse than no section at all.
  const next = all.find((w) => w.id !== work.id) ?? null;

  // Only verified testimonials are publishable — we hold a source and a
  // verification date for every quote on the site, or it doesn't appear.
  const quote = (testimonials?.data ?? []).find((t) => Boolean(t.verifiedAt)) ?? null;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: work.title,
    description: work.description,
    url: `${SITE_URL}/work/${slug}`,
    creator: { '@type': 'Organization', name: 'HaizoTech', url: SITE_URL },
  };

  return (
    <main id="main" className="[overflow-x:clip]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      {n?.hasUnverified && (
        <UnverifiedBanner>
          Anything highlighted in amber was written for the mockup and has <em>not</em> been
          confirmed — figures, timelines and narrative detail. Hover a highlight to see what
          needs checking. This page must not go live until every highlight is verified and the
          marker removed.
        </UnverifiedBanner>
      )}

      {/* ===================================================== outcome first */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm text-text-muted">
            <Link href="/work" className="text-brand-blue hover:underline">
              Our Works
            </Link>
            <span aria-hidden="true"> / </span>
            {work.title}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {(n?.badges ?? [{ label: work.category, tone: 'neutral' as const }]).map((b) => (
              <span
                key={b.label}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-overline font-semibold ${
                  b.tone === 'success'
                    ? 'bg-success/10 text-success'
                    : b.tone === 'brand'
                      ? 'bg-bg-tint-2 text-brand-blue'
                      : 'border border-border bg-bg-tint text-text-muted'
                }`}
              >
                {b.tone === 'success' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                )}
                {b.label}
              </span>
            ))}
          </div>

          <div className="mt-6 max-w-[760px]">
            <p className="text-overline uppercase text-brand-blue">Case study</p>
            <h1 className="mt-3 text-display">{work.title}</h1>
            <p className="mt-5 text-body-lg text-text-muted">
              {n ? n.standfirst : work.description}
            </p>
          </div>

          {n && (
            <div className="mt-10 flex flex-wrap gap-8">
              {n.metrics.map((m) => (
                <div key={m.label} className="border-l-2 border-brand-sky pl-3">
                  <p className="font-display text-2xl font-bold text-text-strong">{m.value}</p>
                  <p className="mt-0.5 text-sm text-text-muted">{m.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ======================================================= screenshots */}
      {n && (
        <section className="pb-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-5 md:grid-cols-3">
              {n.shots.map((s, i) => (
                <Reveal key={s.caption} delay={i * 60} className="min-w-0">
                  <div className="h-full overflow-hidden rounded-token border border-border bg-card shadow-card">
                    <div className="grid aspect-[16/10] place-items-center bg-bg-tint-2 text-brand-sky">
                      {s.glyph}
                    </div>
                    <p className="p-4 text-sm text-text-muted">{s.caption}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <p className="mt-4 text-sm text-text-muted">
              Placeholders — real product screenshots go here once the property signs them off.
            </p>
          </div>
        </section>
      )}

      {/* ============================================================= story
          Problem left, Approach right, What we built left, Result right. The
          alternation is a CSS order swap, so DOM order stays text-then-media on
          every row and the reading order is unchanged for screen readers. */}
      {n ? (
        <section className="bg-bg-tint py-8">
          <div className="mx-auto max-w-6xl px-6">
            {n.story.map((row, i) => {
              const flip = i % 2 === 1;
              return (
                <div
                  key={row.n}
                  className="grid items-center gap-8 border-t border-border py-16 first:border-t-0 md:grid-cols-2"
                >
                  <Reveal className={`min-w-0 ${flip ? 'md:order-2' : ''}`}>
                    <p
                      className="select-none font-display text-[clamp(3rem,7vw,5rem)] font-bold leading-none tracking-[-0.03em] text-bg-tint-2"
                      aria-hidden="true"
                    >
                      {row.n}
                    </p>
                    <h2 className="mt-2 text-h2">{row.heading}</h2>
                    {row.body}
                  </Reveal>

                  <Reveal delay={80} className={`min-w-0 ${flip ? 'md:order-1' : ''}`}>
                    <PanelArt caption={row.caption}>{row.glyph}</PanelArt>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="bg-bg-tint py-20">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-h2">About this project</h2>
            <p className="mt-4 text-body-lg text-text-muted">{work.description}</p>
            <p className="mt-6 text-sm text-text-muted">
              A fuller write-up of this build hasn&rsquo;t been published yet.
            </p>
          </div>
        </section>
      )}

      {/* ================================================== live system state
          Driven by the record: a real link when one exists, and an explicit
          "no public URL" state when it doesn't. Never a dead link. */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-token border border-border bg-card p-6 shadow-card">
            <div>
              <p className="text-overline uppercase text-brand-blue">Live system</p>
              <p className="mt-1 text-sm text-text-muted">
                {work.liveUrl
                  ? 'The deployed system is publicly reachable.'
                  : 'Private deployment — access is with the client.'}
              </p>
            </div>

            {work.liveUrl ? (
              <a
                href={work.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-token border border-border px-4 py-2.5 font-semibold text-brand-blue transition-colors hover:border-brand-blue hover:bg-bg-tint"
              >
                Visit the live system
                <span className="sr-only">(opens in a new tab)</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </a>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border bg-bg-tint px-2.5 py-1 text-overline font-semibold text-text-muted">
                No public URL
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================== how we did it */}
      {n && (
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <div className="max-w-[680px]">
                <p className="text-overline uppercase text-brand-blue">How we did it</p>
                <h2 className="mt-3 text-h2">The decisions behind the build</h2>
                <p className="mt-3 text-body-lg text-text-muted">{n.decisionsLead}</p>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {n.decisions.map((d, i) => (
                <Reveal key={d.title} delay={(i % 2) * 60} className="min-w-0">
                  <div className="h-full rounded-token border border-border bg-card p-8 shadow-card">
                    <span className="mb-4 grid h-11 w-11 place-items-center rounded-[10px] bg-bg-tint-2 text-brand-blue">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={d.icon} />
                      </svg>
                    </span>
                    <h3 className="text-h3">{d.title}</h3>
                    <p className="mt-3 text-sm text-text-muted">{d.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <div className="mt-16 max-w-[680px]">
                <p className="text-overline uppercase text-brand-blue">The engagement</p>
                <h2 className="mt-3 text-h2">How the work ran</h2>
              </div>
            </Reveal>
            <ProcessTimeline steps={n.engagement} />
          </div>
        </section>
      )}

      {/* ============================================================= stack */}
      {n && (
        <section className="bg-bg-tint py-24">
          <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 md:grid-cols-2">
            <Reveal className="min-w-0">
              <p className="text-overline uppercase text-brand-blue">Stack</p>
              <h2 className="mt-3 text-h2">What it&rsquo;s built with</h2>
              <p className="mt-4 text-body-lg text-text-muted">{n.stackLead}</p>
            </Reveal>

            <Reveal delay={60} className="min-w-0">
              <div className="flex flex-col gap-6">
                {n.stackGroups.map((g) => (
                  <div key={g.title}>
                    <h3 className="text-h4">{g.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {g.items.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-bg-tint-2 px-2.5 py-1 text-overline font-semibold text-brand-blue"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ======================================================= testimonial */}
      {quote && (
        <section className="py-24">
          <div className="mx-auto max-w-3xl px-6">
            <Reveal>
              <figure className="rounded-token border border-border bg-card p-8 shadow-card">
                <blockquote className="text-body-lg leading-relaxed text-text-strong">
                  &ldquo;{quote.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-bg-tint-2 font-semibold text-brand-blue">
                    {quote.author.charAt(0)}
                  </span>
                  <span>
                    <span className="block font-semibold text-text-strong">{quote.author}</span>
                    <span className="block text-sm text-text-muted">
                      {[quote.role, quote.company].filter(Boolean).join(', ')}
                    </span>
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-overline font-semibold text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                    Verified
                  </span>
                </figcaption>
              </figure>
            </Reveal>
            <p className="mt-4 text-sm text-text-muted">
              Verified means we hold a source and a verification date for this quote. No
              testimonial is published on this site without both.
            </p>
          </div>
        </section>
      )}

      {/* ==================================================== next case study
          Conditional by design: with nothing else published this renders
          nothing at all — no heading, no card, no dead link. */}
      {next && (
        <section className="bg-bg-tint py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-overline uppercase text-brand-blue">Next case study</p>
                <h2 className="mt-3 text-h2">Keep reading</h2>
              </div>
              <Link
                href="/work"
                className="rounded-token border border-border px-4 py-2.5 text-sm font-semibold text-brand-blue transition-colors hover:border-brand-blue hover:bg-bg-tint-2"
              >
                All work
              </Link>
            </div>

            <Reveal>
              <Link
                href={`/work/${slugify(next.title)}`}
                className="group block overflow-hidden rounded-token border border-border bg-card shadow-card transition-[transform,box-shadow,border-color] duration-300 ease-out-soft hover:-translate-y-1 hover:border-brand-blue hover:shadow-lift"
              >
                <div className="grid items-stretch md:grid-cols-2">
                  <div className="grid min-h-[220px] place-items-center bg-bg-tint-2 text-brand-sky">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18" />
                    </svg>
                  </div>
                  <div className="p-8">
                    <span className="rounded-full border border-border bg-bg-tint px-2.5 py-1 text-overline font-semibold text-text-muted">
                      {next.category}
                    </span>
                    <h3 className="mt-3 text-h3">{next.title}</h3>
                    <p className="mt-2 line-clamp-3 text-text-muted">{next.description}</p>
                    <p className="mt-4 text-sm font-semibold text-brand-blue">
                      Read the case study &rarr;
                    </p>
                  </div>
                </div>
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ========================================================== CTA band */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="rounded-token bg-hero-gradient p-12 text-center text-white">
              <h2 className="text-h2 text-white">
                {n?.ctaHeading ?? 'Got a process still running on paper?'}
              </h2>
              <p className="mx-auto mt-3 max-w-[60ch] text-body-lg text-white/85">
                {n?.ctaBody ??
                  'That’s the problem we’re best at. Tell us how it works today and we’ll tell you what it would take to fix.'}
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
