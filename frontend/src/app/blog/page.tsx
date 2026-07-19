import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { slugify } from '@/lib/slug';
import { Reveal } from '@/components/Reveal';
import { PostCover } from '@/components/PostCover';
import { StaggerHeadline } from '@/components/StaggerHeadline';
import { excerpt, formatDate, readingMinutes } from '@/components/postText';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Engineering notes from the HaizoTech team — write-ups of decisions we actually made on client work: what the constraint was, what we chose, and what it cost us.',
  alternates: { canonical: '/blog' },
};

/** Stand-in cover art, matching the design's `.thumb` glyph. Decorative. */
function ThumbGlyph() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
    </svg>
  );
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'brand' }) {
  return (
    <span
      className={
        tone === 'brand'
          ? 'rounded-full bg-brand-blue px-2.5 py-1 text-overline font-semibold text-white'
          : 'rounded-full bg-bg-tint-2 px-2.5 py-1 text-overline font-semibold text-brand-blue'
      }
    >
      {children}
    </span>
  );
}

/** Date · reading time, the meta row every card and the byline share. */
function PostMeta({ createdAt, content }: { createdAt: string; content: string }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
      <time dateTime={createdAt}>{formatDate(createdAt)}</time>
      <span aria-hidden="true">·</span>
      <span>{readingMinutes(content)} min read</span>
    </p>
  );
}

export default async function BlogPage() {
  const posts = await api.blog('?pageSize=50');
  const list = posts?.data ?? [];

  // Newest first, so the featured slot is always the most recent post.
  const sorted = [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const [featured, ...rest] = sorted;

  // The grid has to look composed at two posts as well as twenty, so the column
  // count follows how many cards there actually are rather than assuming six.
  // Below three cards the third column would leave a conspicuous hole, so the
  // grid stops at two and the cards keep a readable width.
  const gridCols = rest.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2';

  return (
    // overflow-x:clip contains the Reveal entry offset at 375px without
    // creating a scroll container.
    <main id="main" className="[overflow-x:clip]">
      {/* ================================================= hero + featured */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-hero-wash" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="text-overline uppercase text-brand-blue">Blog</p>
          <StaggerHeadline words={['Engineering']} tail="notes." />
          <p className="mt-6 max-w-[62ch] text-body-lg text-text-muted">
            Write-ups of decisions we actually made on client work — what the constraint was,
            what we chose, and what it cost us. No listicles, no reposted release notes.
          </p>

          {featured ? (
            <Reveal className="mt-12 min-w-0">
              <Link
                href={`/blog/${slugify(featured.title)}`}
                className="group block overflow-hidden rounded-token border border-border bg-card shadow-card transition-[translate,transform,box-shadow,border-color] duration-300 ease-out-soft hover:-translate-y-1 hover:border-brand-blue hover:shadow-lift"
              >
                <div className="grid items-stretch md:grid-cols-2">
                  <div className="relative grid min-h-[280px] place-items-center overflow-hidden bg-bg-tint-2 text-brand-sky">
                    <PostCover
                      src={featured.imageUrl}
                      imgClassName="h-full w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.035]"
                    >
                      <ThumbGlyph />
                    </PostCover>
                  </div>

                  <div className="min-w-0 p-6 md:p-8">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="brand">Featured</Badge>
                      {featured.tags.slice(0, 2).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                    <h2 className="mt-4 text-h2 group-hover:text-brand-blue">{featured.title}</h2>
                    <p className="mt-3 text-text-muted">{excerpt(featured.content, 240)}</p>
                    <div className="mt-6">
                      <PostMeta createdAt={featured.createdAt} content={featured.content} />
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          ) : (
            <p className="mt-12 text-body-lg text-text-muted">
              No posts published yet. The first engineering notes are being written now.
            </p>
          )}
        </div>
      </section>

      {/* ======================================================== all posts */}
      {rest.length > 0 && (
        <section className="bg-bg-tint py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <h2 className="text-h2">All posts</h2>
            </Reveal>

            <div className={`mt-10 grid gap-5 ${gridCols}`}>
              {rest.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 60} className="min-w-0">
                  <Link
                    href={`/blog/${slugify(p.title)}`}
                    className="group flex h-full flex-col rounded-token border border-border bg-card p-6 shadow-card transition-[translate,transform,box-shadow,border-color] duration-300 ease-out-soft hover:-translate-y-1 hover:border-brand-blue hover:shadow-lift"
                  >
                    {p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {p.tags.slice(0, 2).map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                    )}
                    <h3 className="mt-4 text-h3 group-hover:text-brand-blue">{p.title}</h3>
                    <p className="mt-3 text-sm text-text-muted">{excerpt(p.content)}</p>
                    <div className="mt-auto pt-5">
                      <PostMeta createdAt={p.createdAt} content={p.content} />
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= CTA band */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="rounded-token bg-hero-gradient p-12 text-center text-white">
              <h2 className="text-h2 text-white">Want this kind of thinking on your project?</h2>
              <p className="mx-auto mt-3 max-w-[60ch] text-body-lg text-white/85">
                The decisions we write about here are the ones we&rsquo;ll be making on your build.
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
