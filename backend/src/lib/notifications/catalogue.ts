/**
 * The single registry of notification types. Titles, messages and deep links are
 * defined here ONCE — never written inline at a producer — so the wording and
 * routing of a notification type live in one reviewable place, and the persisted
 * `url` is always computed the same way.
 *
 * `type` is a TypeScript union (not a DB enum) so the app is the source of truth
 * while the column stays a plain String for old-backend compatibility.
 */
export type NotificationType =
  | 'inquiry.received'
  | 'task.assigned'
  | 'announcement.published'
  | 'blog.published'
  | 'work.published';

export type NotifParams = Record<string, string | undefined>;

export interface CatalogueEntry {
  title: (p: NotifParams) => string;
  message: (p: NotifParams) => string;
  /** Precomputed deep link stored on the row so the bell is a dumb <Link>. */
  url: (p: NotifParams) => string;
  /** Default when a user hasn't set a per-type preference. */
  defaultOn: boolean;
  /** Security-relevant types email regardless of preferences. */
  alwaysEmail?: boolean;
}

export const catalogue: Record<NotificationType, CatalogueEntry> = {
  'inquiry.received': {
    title: () => 'New enquiry',
    message: (p) => `${p.name ?? 'Someone'} sent an enquiry`,
    url: () => '/inquiries',
    defaultOn: true,
  },
  'task.assigned': {
    title: () => 'Task assigned to you',
    message: (p) => `${p.actorName ?? 'Someone'} assigned you “${p.taskTitle ?? 'a task'}”`,
    url: (p) => (p.projectId ? `/projects/${p.projectId}` : '/projects'),
    defaultOn: true,
  },
  'announcement.published': {
    title: () => 'New announcement',
    message: (p) => p.announcementTitle ?? 'A new announcement was posted',
    url: () => '/announcements',
    defaultOn: true,
  },
  'blog.published': {
    title: () => 'Blog post published',
    message: (p) => `“${p.postTitle ?? 'A post'}” is now live`,
    url: () => '/blog',
    defaultOn: true,
  },
  'work.published': {
    title: () => 'Work published',
    message: (p) => `“${p.workTitle ?? 'A case study'}” is now live`,
    url: () => '/work',
    defaultOn: true,
  },
};

export function isNotificationType(t: string): t is NotificationType {
  return t in catalogue;
}
