import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api, SITE_URL } from '@/lib/api';
import { slugify } from '@/lib/slug';

type Props = { params: Promise<{ slug: string }> };

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
  const work = await findWork(slug);
  if (!work) notFound();

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: work.title,
    description: work.description,
    url: `${SITE_URL}/work/${slug}`,
    creator: { '@type': 'Organization', name: 'HaizoTech', url: SITE_URL },
  };

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-sm text-text-muted">
            <Link href="/work" className="text-brand-blue hover:underline">Our Works</Link>
            <span aria-hidden="true"> / </span>
            {work.title}
          </p>
          <span className="mt-5 inline-block rounded-full border border-border bg-bg-tint px-2.5 py-1 text-overline font-semibold text-text-muted">
            {work.category}
          </span>
          <h1 className="mt-4 text-display">{work.title}</h1>
          <p className="mt-6 text-body-lg text-text">{work.description}</p>

          {/* Rendered only when the record actually has a live URL — internal
              systems legitimately have none, and an empty link is worse than none. */}
          {work.liveUrl && (
            <a
              href={work.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-token border border-border px-4 py-2.5 font-semibold text-brand-blue hover:border-brand-blue hover:bg-bg-tint"
            >
              Visit the live system
              <span className="sr-only">(opens in a new tab)</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
          )}
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-token bg-hero-gradient p-12 text-center text-white">
            <h2 className="text-h2 text-white">Got a process still running on paper?</h2>
            <Link href="/contact" className="mt-6 inline-block rounded-token bg-white px-5 py-3 font-semibold text-brand-navy hover:bg-bg-tint">
              Start a Project
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
