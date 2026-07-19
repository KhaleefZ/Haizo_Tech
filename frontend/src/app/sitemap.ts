import type { MetadataRoute } from 'next';
import { api, SITE_URL } from '@/lib/api';
import { slugify } from '@/lib/slug';

/**
 * Generated from the database, not hand-maintained. Publishing a work or a post
 * puts it in the sitemap on the next revalidation without anyone remembering to
 * add it.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, works, posts] = await Promise.all([api.services(), api.work('?pageSize=100'), api.blog('?pageSize=100')]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/services`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/work`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = (services?.data ?? []).map((s) => ({
    url: `${SITE_URL}/services/${s.slug}`,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const workRoutes: MetadataRoute.Sitemap = (works?.data ?? []).map((w) => ({
    url: `${SITE_URL}/work/${slugify(w.title)}`,
    lastModified: w.createdAt ? new Date(w.createdAt) : undefined,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const blogRoutes: MetadataRoute.Sitemap = (posts?.data ?? []).map((p) => ({
    url: `${SITE_URL}/blog/${slugify(p.title)}`,
    lastModified: p.createdAt ? new Date(p.createdAt) : undefined,
    changeFrequency: 'yearly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...serviceRoutes, ...workRoutes, ...blogRoutes];
}
