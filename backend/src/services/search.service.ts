import type { SearchResult, SearchResults } from '@haizo/types';
import { searchAll } from '../repositories/search.repository.js';

const PER_TYPE = 5;

export const searchService = {
  async search(q: string): Promise<SearchResults> {
    const query = q.trim();
    if (!query) return { results: [] };

    const [services, work, blog, testimonials, industries, projects, tasks, clients, inquiries, users] =
      await searchAll(query, PER_TYPE);

    const results: SearchResult[] = [
      ...services.map((s) => ({ type: 'service', id: s.id, label: s.title, sublabel: s.slug, url: '/services' })),
      ...work.map((w) => ({ type: 'work', id: w.id, label: w.title, sublabel: w.slug, url: '/work' })),
      ...blog.map((b) => ({ type: 'blog', id: b.id, label: b.title, sublabel: null, url: '/blog' })),
      ...testimonials.map((t) => ({ type: 'testimonial', id: t.id, label: t.author, sublabel: t.company, url: '/testimonials' })),
      ...industries.map((i) => ({ type: 'industry', id: i.id, label: i.name, sublabel: null, url: '/industries' })),
      ...projects.map((p) => ({ type: 'project', id: p.id, label: p.name, sublabel: p.status, url: `/projects/${p.id}` })),
      ...tasks.map((t) => ({ type: 'task', id: t.id, label: t.title, sublabel: 'Task', url: `/projects/${t.column.projectId}` })),
      ...clients.map((c) => ({ type: 'client', id: c.id, label: c.organization, sublabel: c.contactName, url: '/clients' })),
      ...inquiries.map((n) => ({ type: 'inquiry', id: n.id, label: n.name, sublabel: n.email, url: '/inquiries' })),
      ...users.map((u) => ({ type: 'user', id: u.id, label: u.name, sublabel: u.email, url: '/team' })),
    ];

    return { results };
  },
};
