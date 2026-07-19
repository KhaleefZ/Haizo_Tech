import type { Metadata } from 'next';
import { Sora, Inter } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { PageTransition } from '@/components/PageTransition';
import { CONTACT, SOCIALS } from '@/lib/contact';
import { SITE_URL } from '@/lib/api';
import './globals.css';

const sora = Sora({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-sora', display: 'swap' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'HaizoTech — Custom software, plainly delivered.',
    template: '%s — HaizoTech',
  },
  description:
    'A software services agency in Coimbatore. We design, build and ship custom software, AI systems, web and mobile apps, and secure infrastructure.',
  openGraph: { type: 'website', siteName: 'HaizoTech', locale: 'en_IN' },
  alternates: { canonical: '/' },
};

/**
 * Organization JSON-LD, emitted once on every page.
 *
 * sameAs carries the real social profiles, which is what lets search engines
 * connect this site to those accounts as one entity.
 */
const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'HaizoTech',
  url: SITE_URL,
  description: 'Software services agency in Coimbatore, India.',
  email: CONTACT.email,
  telephone: CONTACT.phoneE164,
  address: {
    '@type': 'PostalAddress',
    streetAddress: CONTACT.street,
    addressLocality: CONTACT.city,
    addressRegion: CONTACT.region,
    postalCode: CONTACT.postalCode,
    addressCountry: CONTACT.country,
  },
  sameAs: SOCIALS.map((s) => s.href),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-0 focus:top-0 focus:z-[100] focus:rounded-br-xl focus:bg-brand-blue focus:px-4 focus:py-3 focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <PageTransition>{children}</PageTransition>
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
      </body>
    </html>
  );
}
