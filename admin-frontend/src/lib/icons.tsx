import * as React from 'react';

/**
 * A small inline icon set (20×20, 1.6 stroke) so the admin has no icon-font or
 * icon-library dependency. Each is keyed by name; the Sidebar renders them by key.
 */
export type IconName =
  | 'dashboard'
  | 'inquiries'
  | 'services'
  | 'work'
  | 'blog'
  | 'testimonials'
  | 'industries'
  | 'categories'
  | 'clients'
  | 'projects'
  | 'team'
  | 'announcements'
  | 'settings'
  | 'activity'
  | 'logout';

const PATHS: Record<IconName, React.ReactNode> = {
  dashboard: <path d="M3 3h6v6H3zM11 3h6v6h-6zM11 11h6v6h-6zM3 11h6v6H3z" />,
  inquiries: <path d="M3 5h14v10H3zM3 6l7 5 7-5" />,
  services: <path d="M10 3 3 6.5 10 10l7-3.5zM3 13.5 10 17l7-3.5M3 10l7 3.5L17 10" />,
  work: <path d="M4 6h12v10H4zM7 6V4h6v2" />,
  blog: <path d="M5 3h7l4 4v10H5zM12 3v4h4M7 11h6M7 14h6" />,
  testimonials: <path d="M4 4h12v8H8l-4 4z" />,
  industries: <path d="M3 17V8l5 3V8l5 3V6l4 2v9zM3 17h14" />,
  categories: <path d="M4 4h5l7 7-5 5-7-7zM7 7h.01" />,
  clients: <path d="M7 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.5 16a4.5 4.5 0 0 1 9 0M13 9a2.5 2.5 0 0 0 0-5M14 11.5a4.5 4.5 0 0 1 3.5 4.5" />,
  projects: <path d="M3 4h4v12H3zM8 4h4v8H8zM13 4h4v10h-4z" />,
  team: <path d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 17a6 6 0 0 1 12 0" />,
  announcements: <path d="M4 8v4h3l6 4V4L7 8zM16 8a3 3 0 0 1 0 4" />,
  settings: <path d="M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4" />,
  logout: <path d="M8 4H4v12h4M13 13l3-3-3-3M16 10H8" />,
  activity: <path d="M3 10h3l2-5 4 10 2-5h3" />,
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
