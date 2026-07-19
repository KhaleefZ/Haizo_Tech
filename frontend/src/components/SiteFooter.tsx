import Link from 'next/link';
import { Logo } from './Logo';
import { ADDRESS_LINE, CONTACT, SOCIALS } from '@/lib/contact';

export function SiteFooter() {
  return (
    <footer className="bg-brand-navy pb-6 pt-16 text-slate-300">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
              <Logo className="h-8 w-8" mono />
              HaizoTech
            </Link>
            <p className="mt-4 max-w-[36ch] text-sm text-slate-400">
              Custom software, plainly delivered. A software services agency in Coimbatore,
              Tamil Nadu.
            </p>
            <div className="mt-5 flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.label} (opens in a new tab)`}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-slate-300 transition-colors hover:border-brand-sky hover:text-white"
                >
                  <s.Icon />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn
            title="Services"
            links={[
              { href: '/services/custom-software-development', label: 'Custom software' },
              { href: '/services/web-mobile-application-development', label: 'Web & mobile apps' },
              { href: '/services/ai-systems-integrations', label: 'AI systems' },
              { href: '/services/network-services-it-solutions', label: 'Network & IT' },
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              { href: '/about', label: 'About' },
              { href: '/work', label: 'Our Works' },
              { href: '/blog', label: 'Blog' },
              { href: '/contact', label: 'Contact' },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { href: '/privacy', label: 'Privacy policy' },
              { href: '/terms', label: 'Terms of service' },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-400">
          <span>© {new Date().getFullYear()} HaizoTech. All rights reserved.</span>
          <span className="flex flex-wrap gap-4">
            <a href={`mailto:${CONTACT.email}`} className="hover:text-white">{CONTACT.email}</a>
            <a href={`tel:${CONTACT.phoneE164}`} className="hover:text-white">{CONTACT.phoneDisplay}</a>
            <span>{ADDRESS_LINE}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      {/* h2 inside the footer landmark — h4 here would skip a heading level. */}
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.08em] text-white">
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-[0.9375rem] text-slate-300 hover:text-white">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
