import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { slugify } from '@/lib/slug';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Our Works',
  description: 'Case studies from HaizoTech — what was wrong before, what we built, and what changed.',
  alternates: { canonical: '/work' },
};

export default async function WorkPage() {
  const works = await api.work('?pageSize=50');
  const list = works?.data ?? [];

  return (
    <main id="main">
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-overline uppercase text-brand-blue">Our works</p>
          <h1 className="mt-4 max-w-[20ch] text-display">What we&rsquo;ve built, and what it changed</h1>
          <p className="mt-6 max-w-[58ch] text-body-lg text-text-muted">
            Systems running in production. Each one says what was wrong before, what we
            actually did, and what changed afterwards.
          </p>

          {list.length ? (
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {list.map((w, i) => (
                <Reveal key={w.id} delay={(i % 3) * 60}>
                  <Link
                    href={`/work/${slugify(w.title)}`}
                    className="group block h-full overflow-hidden rounded-token border border-border bg-card shadow-card transition-[translate,transform,box-shadow,border-color] hover:-translate-y-1 hover:border-brand-blue hover:shadow-lift"
                  >
                    <div className="grid aspect-[16/10] place-items-center bg-bg-tint-2 text-brand-sky">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18" />
                      </svg>
                    </div>
                    <div className="p-6">
                      <span className="rounded-full border border-border bg-bg-tint px-2.5 py-1 text-overline font-semibold text-text-muted">
                        {w.category}
                      </span>
                      <h2 className="mt-3 text-h3">{w.title}</h2>
                      <p className="mt-2 line-clamp-3 text-sm text-text-muted">{w.description}</p>
                      <p className="mt-4 text-sm font-semibold text-brand-blue">Read the case study &rarr;</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="mt-12 text-text-muted">No case studies published yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
