import { Reveal } from './Reveal';

export type ProcessStep = {
  /** Two-digit ordinal shown above the title, e.g. "01". */
  n: string;
  title: string;
  /** Optional one-line summary rendered in bold above the body. */
  lead?: string;
  body: string;
};

/**
 * The design's `.timeline` pattern — numbered nodes threaded onto a vertical
 * spine, each node holding a pulsing dot.
 *
 * Generalised to accept `steps` so the service detail pages can supply their
 * own four. The default is the studio-wide development process used on the
 * home page, which is why it lives here rather than at the call site.
 */
const DEFAULT_STEPS: ProcessStep[] = [
  {
    n: '01',
    title: 'Research & Planning',
    lead: 'Understanding constraints and requirements.',
    body: 'We map the problem, the users and the limits you actually operate under, then write down what v1 will and won’t include.',
  },
  {
    n: '02',
    title: 'Design & Prototype',
    lead: 'System design and technical foundation.',
    body: 'Flows and screens you can click, and the data model underneath them, settled before anything is expensive to change.',
  },
  {
    n: '03',
    title: 'Development & Testing',
    lead: 'Iterative sprint execution and QA.',
    body: 'Weekly working software on a staging URL you can open. Typecheck, lint and tests gate every merge.',
  },
  {
    n: '04',
    title: 'Deployment & Maintenance',
    lead: 'Staging to production rollout.',
    body: 'We deploy, watch it, hand over the keys and stay on through the settling-in period.',
  },
];

export function ProcessTimeline({ steps = DEFAULT_STEPS }: { steps?: ProcessStep[] }) {
  return (
    <div className="relative mt-10">
      {/* The spine, running between the first and last node centres. */}
      <div
        className="pointer-events-none absolute bottom-9 left-4 top-9 w-0.5 -translate-x-1/2 bg-border"
        aria-hidden="true"
      />

      {steps.map((s, i) => (
        <Reveal key={s.n} delay={i * 140}>
          <div className="grid grid-cols-[2rem_1fr] gap-5 py-5">
            <div className="relative z-10 grid h-8 w-8 place-items-center rounded-full border-[3px] border-brand-blue bg-bg">
              <span
                className="h-3 w-3 animate-[pulse-dot_2s_ease-in-out_infinite] rounded-full bg-brand-sky"
                style={{ animationDelay: `${i * 400}ms` }}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <p className="font-display text-overline font-bold uppercase tracking-[0.08em] text-brand-blue">
                {s.n}
              </p>
              <h3 className="mt-1.5 text-h3">{s.title}</h3>
              {s.lead && <p className="mt-1.5 text-sm font-semibold text-text-strong">{s.lead}</p>}
              <p className="mt-2 max-w-[68ch] text-sm text-text-muted">{s.body}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
