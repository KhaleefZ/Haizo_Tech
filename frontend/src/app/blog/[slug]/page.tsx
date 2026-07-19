import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api, SITE_URL } from '@/lib/api';
import { slugify } from '@/lib/slug';

type Props = { params: Promise<{ slug: string }> };

async function findPost(slug: string) {
  const posts = await api.blog('?pageSize=100');
  return (posts?.data ?? []).find((p) => slugify(p.title) === slug) ?? null;
}

export async function generateStaticParams() {
  const posts = await api.blog('?pageSize=100');
  return (posts?.data ?? []).map((p) => ({ slug: slugify(p.title) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.title,
    description: post.content.replace(/[#*`>_]/g, '').slice(0, 160),
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { type: 'article', publishedTime: post.createdAt },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post) notFound();

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.createdAt,
    author: { '@type': post.authorName ? 'Person' : 'Organization', name: post.authorName ?? 'HaizoTech' },
    publisher: { '@type': 'Organization', name: 'HaizoTech', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
  };

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <article className="py-20">
        <div className="mx-auto max-w-[760px] px-6">
          <p className="text-sm text-text-muted">
            <Link href="/blog" className="text-brand-blue hover:underline">Blog</Link>
            <span aria-hidden="true"> / </span>
            {post.title}
          </p>

          {post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span key={t} className="rounded-full bg-bg-tint-2 px-2.5 py-1 text-overline font-semibold text-brand-blue">{t}</span>
              ))}
            </div>
          )}

          <h1 className="mt-4 text-display">{post.title}</h1>

          <div className="mt-6 flex items-center gap-3 border-b border-border pb-6">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-bg-tint-2 font-semibold text-brand-blue">
              {(post.authorName ?? 'H').charAt(0)}
            </span>
            <span className="text-sm">
              <span className="block font-semibold text-text-strong">{post.authorName ?? 'HaizoTech'}</span>
              <time dateTime={post.createdAt} className="block text-text-muted">
                {new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>
            </span>
          </div>

          {/* Body is plain text from the CMS. Rendered as paragraphs rather than
              dangerouslySetInnerHTML — the admin is trusted, but content is still
              content, and one XSS here would be on every reader. */}
          <div className="mt-8 flex flex-col gap-4 text-text">
            {post.content.split(/\n{2,}/).map((para, i) => (
              <p key={i} className="leading-relaxed">{para}</p>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}
