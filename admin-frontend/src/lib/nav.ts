import type { IconName } from './icons';
import type { Role } from '@haizo/types';

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  /** Roles allowed to see this item. Omitted → visible to any signed-in user. */
  roles?: Role[];
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

/**
 * The admin information architecture. `roles` mirrors the backend role matrix so
 * the sidebar never offers a link the API would 403 — but it is display only.
 * The real gate is server-side (requireRole); this just avoids dead-ends.
 */
export const NAV: NavGroup[] = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', href: '/', icon: 'dashboard' }],
  },
  {
    heading: 'Content',
    items: [
      { label: 'Services', href: '/services', icon: 'services' },
      { label: 'Work', href: '/work', icon: 'work' },
      { label: 'Blog', href: '/blog', icon: 'blog' },
      { label: 'Testimonials', href: '/testimonials', icon: 'testimonials' },
      { label: 'Industries', href: '/industries', icon: 'industries' },
      { label: 'Categories', href: '/categories', icon: 'categories' },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Inquiries', href: '/inquiries', icon: 'inquiries' },
      { label: 'Clients', href: '/clients', icon: 'clients' },
      { label: 'Projects', href: '/projects', icon: 'projects' },
      { label: 'Team', href: '/team', icon: 'team', roles: ['SUPER_ADMIN'] },
      { label: 'Announcements', href: '/announcements', icon: 'announcements' },
    ],
  },
  {
    heading: 'System',
    items: [
      { label: 'Activity', href: '/activity', icon: 'activity', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { label: 'Settings', href: '/settings', icon: 'settings' },
    ],
  },
];
