'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';

const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/work', label: 'Our Works' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on navigation, otherwise it stays open over the new page.
  useEffect(() => setOpen(false), [pathname]);

  /** A section is current if the path is the page or anything beneath it. */
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={`sticky top-0 z-50 bg-bg/90 backdrop-blur-sm transition-[box-shadow,border-color] duration-300 ${
        scrolled ? 'border-b border-border shadow-[0_1px_12px_rgba(15,42,87,0.05)]' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold text-brand-navy">
          <Logo className="h-8 w-8" />
          HaizoTech
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-6 md:flex">
          {NAV.map((item) => {
            const current = isCurrent(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={`group relative py-1 text-[0.9375rem] font-medium transition-colors ${
                  current ? 'text-text-strong' : 'text-text hover:text-text-strong'
                }`}
              >
                {item.label}
                {/* The underline scales from the left on hover and stays put on the
                    current page. Transform-only, so it cannot shift the layout. */}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 bottom-0 h-0.5 origin-left rounded-sm bg-brand-blue transition-transform duration-300 ease-out-soft ${
                    current ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </Link>
            );
          })}
          <Link
            href="/contact"
            className="rounded-token bg-brand-blue px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-600"
          >
            Start a Project
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="ml-auto rounded-[10px] border border-border p-2 text-text-strong md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>

      {/* Grid-rows trick: animates height without needing a measured pixel value. */}
      <div
        id="mobile-nav"
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out-soft md:hidden ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <nav aria-label="Main (mobile)" className="min-h-0">
          <div className="flex flex-col gap-1 border-t border-border bg-bg px-6 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrent(item.href) ? 'page' : undefined}
                className={`rounded-lg px-2 py-2.5 font-medium ${
                  isCurrent(item.href) ? 'bg-bg-tint-2 text-brand-blue' : 'text-text'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/contact" className="mt-2 rounded-token bg-brand-blue px-4 py-2.5 text-center font-semibold text-white">
              Start a Project
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
