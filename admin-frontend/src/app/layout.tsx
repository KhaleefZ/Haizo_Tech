import type { Metadata } from 'next';
import { Sora, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const sora = Sora({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-sora', display: 'swap' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'HaizoTech Admin', template: '%s — HaizoTech Admin' },
  description: 'Internal operations dashboard.',
  // Never let an internal tool be indexed.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      {/* Same palette as the public site, tighter rhythm — not a second theme. */}
      <body className="admin-density bg-bg-tint">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
