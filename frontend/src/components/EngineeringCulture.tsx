import { Reveal } from './Reveal';

/**
 * The live site's "Our Engineering Culture", cut to the point.
 *
 * The original Scalable Architecture copy read "proprietary consensus driving
 * high-frequency operations" — leftover web3 boilerplate that means nothing to a
 * hospital or a hotel. Rewritten as plain engineering. The security checklist is
 * kept verbatim; it is specific and it is the persuasive part.
 */
const PILLARS = [
  {
    title: 'Scalable architecture',
    body: 'Still fast on year three of data, not just launch week. Pooled connections, indexes chosen against the queries you actually run, and slow work moved to background jobs.',
    icon: <path d="M3 12h4l3 8 4-16 3 8h4" />,
  },
  {
    title: 'Seamless connectivity',
    body: 'Fits the tools you already run on. Payments, accounting, calendars and identity wired together so data moves on its own — documented, with the credentials yours.',
    icon: (
      <>
        <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
      </>
    ),
  },
  {
    title: 'Secure by design',
    body: 'Zero-trust by default, with the checks running in the pipeline on every merge rather than as an audit at the end.',
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    checklist: [
      'End-to-End Data Encryption',
      'Role-Based Access Control (RBAC)',
      'Regular Vulnerability Assessments',
      'Automated Security CI/CD Pipelines',
      'Industry Standard Compliance (GDPR, HIPAA)',
    ],
  },
];

export function EngineeringCulture() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-overline uppercase text-brand-blue">How we work</p>
          <h2 className="mt-3 text-h2">Our engineering culture</h2>
          <p className="mt-3 max-w-[60ch] text-body-lg text-text-muted">
            Scalable architecture, clean code, and security that doesn&rsquo;t slow delivery down.
          </p>
        </Reveal>

        {/* items-stretch keeps the three cards the same height regardless of how
            much copy each carries — the checklist card is naturally taller. */}
        <div className="mt-10 grid items-stretch gap-5 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 110} className="h-full">
              <article className="group h-full rounded-token border border-border bg-card p-6 shadow-card transition-[transform,box-shadow,border-color] duration-300 ease-out-soft hover:-translate-y-1 hover:border-brand-blue hover:shadow-lift">
                <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-bg-tint-2 text-brand-blue transition-transform duration-300 ease-out-soft group-hover:-translate-y-0.5 group-hover:scale-105">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {p.icon}
                  </svg>
                </span>
                <h3 className="mt-4 text-h4">{p.title}</h3>
                <p className="mt-3 text-text-muted">{p.body}</p>

                {p.checklist && (
                  <ul className="mt-4 flex flex-col gap-2.5 border-t border-border pt-4">
                    {p.checklist.map((c) => (
                      <li key={c} className="flex items-start gap-2.5 text-sm text-text">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none text-success" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
