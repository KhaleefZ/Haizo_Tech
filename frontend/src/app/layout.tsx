import type { Metadata } from 'next';
import { Sora, Inter } from 'next/font/google';
import './globals.css';

// Self-hosted by next/font: no layout shift, no third-party request on first paint.
const sora = Sora({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-sora', display: 'swap' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'HaizoTech — Custom software, plainly delivered.', template: '%s — HaizoTech' },
  description:
    'A software services agency in Coimbatore. We design, build and ship custom software, AI systems, web and mobile apps, and secure infrastructure.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-0 focus:top-0 focus:z-50 focus:rounded-br-xl focus:bg-brand-blue focus:px-4 focus:py-3 focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
