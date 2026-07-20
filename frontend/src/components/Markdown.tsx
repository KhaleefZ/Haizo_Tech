import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders a post's Markdown (or plain text) body with the site's typography —
 * bold section headings, a clear size hierarchy, comfortable line-height and
 * spacing, styled lists, quotes, code and images.
 *
 * A server component: react-markdown builds React elements (never
 * dangerouslySetInnerHTML), so this is XSS-safe by construction and ships no
 * client JS. Plain-text bodies still render fine — they just become paragraphs.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: (p) => <h2 className="mt-10 text-h3 font-bold text-text-strong" {...p} />,
        h2: (p) => <h2 className="mt-10 text-h3 font-bold text-text-strong" {...p} />,
        h3: (p) => <h3 className="mt-8 text-h4 font-bold text-text-strong" {...p} />,
        h4: (p) => <h4 className="mt-6 text-lg font-bold text-text-strong" {...p} />,
        p: (p) => <p className="mt-5 leading-[1.75]" {...p} />,
        ul: (p) => <ul className="mt-5 ml-5 flex list-disc flex-col gap-2 marker:text-brand-blue" {...p} />,
        ol: (p) => (
          <ol className="mt-5 ml-5 flex list-decimal flex-col gap-2 marker:font-semibold marker:text-brand-blue" {...p} />
        ),
        li: (p) => <li className="pl-1 leading-[1.7]" {...p} />,
        strong: (p) => <strong className="font-semibold text-text-strong" {...p} />,
        em: (p) => <em className="italic" {...p} />,
        a: (p) => (
          <a
            className="text-brand-blue underline underline-offset-2 hover:no-underline"
            target={p.href?.startsWith('http') ? '_blank' : undefined}
            rel={p.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            {...p}
          />
        ),
        blockquote: (p) => (
          <blockquote className="mt-6 border-l-4 border-brand-blue/40 pl-4 text-text-muted italic" {...p} />
        ),
        hr: () => <hr className="mt-8 border-border" />,
        code: ({ className, ...p }) =>
          className?.includes('language-') ? (
            <code className={`${className ?? ''} text-sm`} {...p} />
          ) : (
            <code className="rounded bg-bg-tint px-1.5 py-0.5 text-[0.9em] text-brand-blue" {...p} />
          ),
        pre: (p) => (
          <pre className="mt-5 overflow-x-auto rounded-token border border-border bg-bg-tint-2 p-4 text-sm" {...p} />
        ),
        img: (p) => <img className="mt-6 rounded-token border border-border" loading="lazy" alt={p.alt ?? ''} {...p} />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
