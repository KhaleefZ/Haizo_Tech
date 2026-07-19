import Link from 'next/link';
import { Logo } from './Logo';

const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/work', label: 'Our Works' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-transparent bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex h-18 max-w-6xl items-center gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold text-brand-navy">
          <Logo className="h-8 w-8" />
          HaizoTech
        </Link>
        <nav aria-label="Main" className="ml-auto hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[0.9375rem] font-medium text-text transition-colors hover:text-text-strong"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="rounded-token bg-brand-blue px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-600"
          >
            Start a Project
          </Link>
        </nav>
        <Link href="/contact" className="ml-auto rounded-token bg-brand-blue px-3.5 py-2 text-sm font-semibold text-white md:hidden">
          Start
        </Link>
      </div>
    </header>
  );
}
