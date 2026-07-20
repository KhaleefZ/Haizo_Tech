'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders Markdown with the same typography the public blog uses, for the admin
 * post preview. react-markdown builds React elements (no dangerouslySetInnerHTML),
 * so it's XSS-safe; plain text just becomes paragraphs.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: (p) => <h2 className="mt-8 text-2xl font-bold text-text-strong" {...p} />,
        h2: (p) => <h2 className="mt-8 text-2xl font-bold text-text-strong" {...p} />,
        h3: (p) => <h3 className="mt-6 text-xl font-bold text-text-strong" {...p} />,
        h4: (p) => <h4 className="mt-5 text-lg font-bold text-text-strong" {...p} />,
        p: (p) => <p className="mt-4 leading-[1.75]" {...p} />,
        ul: (p) => <ul className="mt-4 ml-5 flex list-disc flex-col gap-2 marker:text-brand-blue" {...p} />,
        ol: (p) => (
          <ol className="mt-4 ml-5 flex list-decimal flex-col gap-2 marker:font-semibold marker:text-brand-blue" {...p} />
        ),
        li: (p) => <li className="pl-1 leading-[1.7]" {...p} />,
        strong: (p) => <strong className="font-semibold text-text-strong" {...p} />,
        em: (p) => <em className="italic" {...p} />,
        a: (p) => <a className="text-brand-blue underline underline-offset-2" {...p} />,
        blockquote: (p) => (
          <blockquote className="mt-5 border-l-4 border-brand-blue/40 pl-4 text-text-muted italic" {...p} />
        ),
        hr: () => <hr className="mt-6 border-border" />,
        code: ({ className, ...p }) =>
          className?.includes('language-') ? (
            <code className={`${className ?? ''} text-sm`} {...p} />
          ) : (
            <code className="rounded bg-bg-tint px-1.5 py-0.5 text-[0.9em] text-brand-blue" {...p} />
          ),
        pre: (p) => (
          <pre className="mt-4 overflow-x-auto rounded-token border border-border bg-bg-tint-2 p-4 text-sm" {...p} />
        ),
        img: (p) => <img className="mt-5 rounded-token border border-border" alt={p.alt ?? ''} {...p} />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
