import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { slugify } from '@/lib/slug';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Engineering notes from the HaizoTech team.',
  alternates: { canonical: '/blog' },
};

function readingMinutes(content: string) {
  return Math.max(1, Math.round(content.split(/\s+/).length / 200));
}

export default async function BlogPage() {
  const posts = await api.blog('?pageSize=50');
  const list = posts?.data ?? [];

  return (
    <main id="main">
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-overline uppercase text-brand-blue">Blog</p>
          <h1 className="mt-4 text-display">Engineering notes</h1>
          <p className="mt-6 max-w-[58ch] text-body-lg text-text-muted">
            What we&rsquo;ve learned building and running the systems our clients depend on.
          </p>

          {list.length ? (
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {list.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 60}>
                  <Link
                    href={`/blog/${slugify(p.title)}`}
                    className="group flex h-full flex-col rounded-token border border-border bg-card p-6 shadow-card transition-[translate,transform,box-shadow,border-color] hover:-translate-y-1 hover:border-brand-blue hover:shadow-lift"
                  >
                    {p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {p.tags.slice(0, 2).map((t) => (
                          <span key={t} className="rounded-full bg-bg-tint-2 px-2.5 py-1 text-overline font-semibold text-brand-blue">{t}</span>
                        ))}
                      </div>
                    )}
                    <h2 className="mt-3 text-h3">{p.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm text-text-muted">
                      {p.content.replace(/[#*`>_]/g, '').slice(0, 160)}…
                    </p>
                    <p className="mt-auto pt-4 text-sm text-text-muted">
                      {p.authorName ?? 'HaizoTech'}
                      <span aria-hidden="true"> · </span>
                      <time dateTime={p.createdAt}>
                        {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </time>
                      <span aria-hidden="true"> · </span>
                      {readingMinutes(p.content)} min read
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="mt-12 text-text-muted">No posts published yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
