import { Reveal } from './Reveal';

/**
 * Mirrors the live site's Development Process — four numbered nodes on a
 * connecting spine, each with a pulsing dot. Step names are the live site's own.
 */
const STEPS = [
  { n: '01', title: 'Research & Planning', lead: 'Understanding constraints and requirements.', body: 'We map the problem, the users and the limits you actually operate under, then write down what v1 will and won\\u2019t include.' },
  { n: '02', title: 'Design & Prototype', lead: 'System design and technical foundation.', body: 'Flows and screens you can click, and the data model underneath them, settled before anything is expensive to change.' },
  { n: '03', title: 'Development & Testing', lead: 'Iterative sprint execution and QA.', body: 'Weekly working software on a staging URL you can open. Typecheck, lint and tests gate every merge.' },
  { n: '04', title: 'Deployment & Maintenance', lead: 'Staging to production rollout.', body: 'We deploy, watch it, hand over the keys and stay on through the settling-in period.' },
];

export function ProcessTimeline() {
  return (
    <div className="relative mt-10 grid gap-8 md:grid-cols-4">
      {/* The spine. Hidden on mobile, where the steps stack. */}
      <div className="pointer-events-none absolute left-4 right-4 top-4 hidden h-px bg-border md:block" aria-hidden="true" />
      {STEPS.map((s, i) => (
        <Reveal key={s.n} delay={i * 140}>
          <div className="relative">
            <div className="relative z-10 grid h-8 w-8 place-items-center rounded-full border-[3px] border-brand-blue bg-bg">
              <span className="h-3 w-3 animate-[pulse-dot_2s_ease-in-out_infinite] rounded-full bg-brand-sky" style={{ animationDelay: `${i * 400}ms` }} aria-hidden="true" />
            </div>
            <p className="mt-4 font-display text-overline font-bold uppercase tracking-[0.08em] text-brand-blue">{s.n}</p>
            <h3 className="mt-1.5 text-h3">{s.title}</h3>
            <p className="mt-1.5 text-sm font-semibold text-text-strong">{s.lead}</p>
            <p className="mt-2 text-sm text-text-muted">{s.body}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
