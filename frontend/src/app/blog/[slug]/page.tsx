import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api, SITE_URL } from '@/lib/api';
import { slugify } from '@/lib/slug';
import { Reveal } from '@/components/Reveal';
import { ReadingProgress } from '@/components/ReadingProgress';
import { PostCover } from '@/components/PostCover';
import {
  excerpt,
  formatDate,
  initials,
  paragraphs,
  readingMinutes,
} from '@/components/postText';

type Props = { params: Promise<{ slug: string }> };

const BODY_ID = 'article-body';

async function allPosts() {
  const posts = await api.blog('?pageSize=100');
  return posts?.data ?? [];
}

async function findPost(slug: string) {
  return (await allPosts()).find((p) => slugify(p.title) === slug) ?? null;
}

export async function generateStaticParams() {
  return (await allPosts()).map((p) => ({ slug: slugify(p.title) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.title,
    description: excerpt(post.content, 160),
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { type: 'article', publishedTime: post.createdAt },
  };
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-bg-tint-2 px-2.5 py-1 text-overline font-semibold text-brand-blue">
      {children}
    </span>
  );
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const posts = await allPosts();
  const post = posts.find((p) => slugify(p.title) === slug) ?? null;
  if (!post) notFound();

  const author = post.authorName ?? 'HaizoTech';
  const body = paragraphs(post.content);
  // The design opens with a standfirst above the byline. The CMS has no
  // separate excerpt field, so the opening paragraph is promoted into that
  // role and the remainder becomes the body — no text is duplicated or
  // invented. A single-paragraph post keeps that paragraph as the body
  // instead, otherwise promoting it would leave the article empty.
  const hasStandfirst = body.length > 1;
  const standfirst = hasStandfirst ? body[0] : null;
  const rest = hasStandfirst ? body.slice(1) : body;

  /**
   * Related posts: anything sharing a tag first, then the most recent others,
   * so the section is never empty while more than one post exists.
   */
  const others = posts.filter((p) => p.id !== post.id);
  const shareTag = others.filter((p) => p.tags.some((t) => post.tags.includes(t)));
  const byRecency = [...others].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const related = [...new Set([...shareTag, ...byRecency])].slice(0, 2);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.createdAt,
    author: {
      '@type': post.authorName ? 'Person' : 'Organization',
      name: author,
    },
    publisher: { '@type': 'Organization', name: 'HaizoTech', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
  };

  return (
    <main id="main" className="[overflow-x:clip]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <article>
        {/* ==================================================== article head */}
        <section className="pb-6 pt-20">
          <div className="mx-auto max-w-[820px] px-6">
            <nav aria-label="Breadcrumb">
              <p className="text-sm text-text-muted">
                <Link href="/blog" className="text-brand-blue hover:underline">
                  Blog
                </Link>
                <span aria-hidden="true"> / </span>
                <span aria-current="page">{post.title}</span>
              </p>
            </nav>

            {post.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            )}

            <h1 className="mt-4 text-display">{post.title}</h1>

            {standfirst && (
              <p className="mt-6 max-w-[68ch] text-body-lg text-text-muted">{standfirst}</p>
            )}

            {/* Byline */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span
                className="grid h-10 w-10 flex-none place-items-center rounded-full bg-bg-tint-2 text-sm font-semibold text-brand-blue"
                aria-hidden="true"
              >
                {initials(author)}
              </span>
              <div>
                <p className="font-semibold text-text-strong">{author}</p>
                <p className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
                  <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                  <span aria-hidden="true">·</span>
                  <span>{readingMinutes(post.content)} min read</span>
                </p>
              </div>
            </div>

            {/* Cover art. Decorative — the caption carries whatever meaning it
                has, so the art itself is hidden from assistive technology. */}
            <Reveal delay={80} className="mt-10 min-w-0">
              <figure className="relative grid aspect-video place-items-center overflow-hidden rounded-token border border-border bg-bg-tint shadow-card">
                <PostCover src={post.imageUrl} imgClassName="h-full w-full object-cover">
                  <svg
                    width="72"
                    height="72"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.1"
                    className="text-brand-sky opacity-85"
                    aria-hidden="true"
                  >
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
                  </svg>
                </PostCover>
                <figcaption className="absolute inset-x-0 bottom-0 border-t border-border bg-card/95 px-4 py-3 text-sm text-text-muted">
                  {post.title}
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </section>

        {/* ========================================================== body */}
        <section className="pb-24">
          <div className="mx-auto max-w-[820px] px-6">
            <ReadingProgress targetId={BODY_ID} />

            {/* Body is plain text from the CMS. Rendered as paragraphs rather
                than dangerouslySetInnerHTML — the admin is trusted, but content
                is still content, and one XSS here would be on every reader. */}
            <div id={BODY_ID} className="mt-10 flex max-w-[68ch] flex-col gap-5 text-text">
              {rest.map((para, i) => (
                <p key={i} className="leading-[1.75]">
                  {para}
                </p>
              ))}
            </div>

            {/* =================================================== author card */}
            <Reveal className="mt-12 min-w-0">
              <div className="rounded-token border border-border bg-card p-6 shadow-card">
                <h2 className="text-h4">About the author</h2>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <span
                    className="grid h-14 w-14 flex-none place-items-center rounded-full bg-bg-tint-2 font-semibold text-brand-blue"
                    aria-hidden="true"
                  >
                    {initials(author)}
                  </span>
                  <div>
                    <p className="font-semibold text-text-strong">{author}</p>
                    <p className="text-sm text-text-muted">HaizoTech</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-text-muted">
                  Writes here about the engineering decisions behind the systems we build and run.{' '}
                  <Link href="/about" className="text-brand-blue hover:underline">
                    More about the team
                  </Link>
                  .
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      </article>

      {/* ===================================================== related posts */}
      {related.length > 0 && (
        <section className="bg-bg-tint py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <h2 className="text-h2">Related reading</h2>
            </Reveal>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={i * 60} className="min-w-0">
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
