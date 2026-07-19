import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api, SITE_URL } from '@/lib/api';
import { Reveal } from '@/components/Reveal';

type Props = { params: Promise<{ slug: string }> };

/** Pre-render every published service at build time. */
export async function generateStaticParams() {
  const services = await api.services();
  return (services?.data ?? []).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await api.service(slug);
  if (!service) return { title: 'Service not found' };
  return {
    title: service.seoTitle ?? service.title,
    description: service.seoDescription ?? service.summary,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServiceDetail({ params }: Props) {
  const { slug } = await params;
  const service = await api.service(slug);
  if (!service) notFound();

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.summary,
    provider: { '@type': 'Organization', name: 'HaizoTech', url: SITE_URL },
    areaServed: 'Worldwide',
    url: `${SITE_URL}/services/${service.slug}`,
  };

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 bg-hero-wash" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6">
          <p className="text-sm text-text-muted">
            <Link href="/services" className="text-brand-blue hover:underline">Services</Link>
            <span aria-hidden="true"> / </span>
            {service.title}
          </p>
          <h1 className="mt-4 text-display">{service.title}</h1>
          <p className="mt-6 text-body-lg text-text">{service.summary}</p>
          <Link href="/contact" className="mt-8 inline-block rounded-token bg-brand-blue px-5 py-3 font-semibold text-white hover:bg-brand-blue-600">
            Start a Project
          </Link>
        </div>
      </section>

      {service.deliverables.length > 0 && (
        <section className="bg-bg-tint py-20">
          <div className="mx-auto max-w-4xl px-6">
            <Reveal>
              <h2 className="text-h2">What you actually get</h2>
            </Reveal>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {service.deliverables.map((d, i) => (
                <Reveal key={d} delay={i * 60}>
                  <div className="h-full rounded-token border border-border bg-card p-6 shadow-card">
                    <h3 className="text-h3">{d}</h3>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {service.stack.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-h2">What it&rsquo;s built with</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {service.stack.map((t) => (
                <span key={t} className="rounded-full bg-bg-tint-2 px-3 py-1.5 text-sm font-semibold text-brand-blue">{t}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-token bg-hero-gradient p-12 text-center text-white">
            <h2 className="text-h2 text-white">Tell us what you&rsquo;re trying to build</h2>
            <Link href="/contact" className="mt-6 inline-block rounded-token bg-white px-5 py-3 font-semibold text-brand-navy hover:bg-bg-tint">
              Start a Project
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
