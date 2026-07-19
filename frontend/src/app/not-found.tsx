import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="py-24">
      <div className="mx-auto max-w-[640px] px-6">
        <p className="text-overline uppercase text-brand-blue">404</p>
        <h1 className="mt-4 text-display">We can&rsquo;t find that page</h1>
        <p className="mt-6 text-body-lg text-text-muted">
          The link may be out of date, or the page may have moved. Here is where most people
          are heading.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {[
            { href: '/', label: 'Home' },
            { href: '/services', label: 'Services' },
            { href: '/work', label: 'Our Works' },
            { href: '/blog', label: 'Blog' },
            { href: '/contact', label: 'Contact' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-token border border-border px-4 py-2.5 font-semibold text-brand-blue transition-colors hover:border-brand-blue hover:bg-bg-tint">
              {l.label}
            </Link>
          ))}
        </div>
        <p className="mt-8 text-sm text-text-muted">
          If you followed a link from our site and it broke, please{' '}
          <Link href="/contact" className="text-brand-blue underline">tell us</Link> — we&rsquo;ll fix it.
        </p>
      </div>
    </main>
  );
}
