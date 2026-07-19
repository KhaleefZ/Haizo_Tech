import type {
  BlogPostList,
  IndustryList,
  ServiceList,
  TestimonialList,
  WorkList,
} from '@haizo/types';

/**
 * Server-side data access for the marketing site.
 *
 * Caching is the whole point of this file. Every fetch declares a cache TAG and a
 * long `revalidate` floor. Nothing waits for the floor in practice — publishing
 * content triggers /api/revalidate, which invalidates the matching tag and the
 * page rebuilds within a second or so.
 *
 * The floor exists purely as a backstop: if the webhook were ever misconfigured,
 * the worst case is content one hour stale rather than stale forever. The old
 * site used `revalidate: 600` with no webhook at all, which is why an edit could
 * sit invisible for ten minutes.
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

const SAFETY_FLOOR_SECONDS = 3600;

async function get<T>(path: string, tags: string[]): Promise<T | null> {
  try {
    const res = await fetch(`${API}/v1${path}`, {
      next: { revalidate: SAFETY_FLOOR_SECONDS, tags },
      headers: { accept: 'application/json' },
    });
    if (!res.ok) {
      console.error(`API ${path} responded ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    // A page that renders without its data beats a page that 500s. Callers
    // handle null by rendering an empty state.
    console.error(`API ${path} unreachable`, err);
    return null;
  }
}

export const api = {
  services: () => get<ServiceList>('/services', ['services']),
  service: (slug: string) => get<import('@haizo/types').Service>(`/services/${slug}`, ['services', `service:${slug}`]),
  industries: () => get<IndustryList>('/industries', ['industries']),
  testimonials: () => get<TestimonialList>('/testimonials', ['testimonials']),
  work: (params = '') => get<WorkList>(`/work${params}`, ['works']),
  blog: (params = '') => get<BlogPostList>(`/blog${params}`, ['blogs']),
};

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
