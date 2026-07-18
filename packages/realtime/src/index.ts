/**
 * Socket event names and payload types, shared by the server and both apps.
 *
 * They live in one package because the previous system defined event names as
 * string literals in three places, so a rename silently broke the client. Import
 * from here and a typo becomes a type error.
 *
 * ROOM NAMING — the existing rooms (`role_*`, `user_*`, `project_*`) are ported
 * as-is because the live kanban depends on them. Chat deliberately uses a
 * disjoint `conv_*` prefix so the two never collide, and a project's chat uses
 * `conv_<id>` rather than `project_<id>` so kanban traffic and chat traffic stay
 * separately subscribable.
 */

export const rooms = {
  role: (role: string) => `role_${role}`,
  user: (userId: string) => `user_${userId}`,
  project: (projectId: string) => `project_${projectId}`,
  conversation: (conversationId: string) => `conv_${conversationId}`,
  presence: 'presence',
  supportInbox: 'support_inbox',
} as const;

/** Server → client. */
export const serverEvents = {
  notificationNew: 'notification:new',
  notificationCount: 'notification:count',
  notificationRead: 'notification:read',
  authExpired: 'auth:expired',
} as const;

/** Client → server. */
export const clientEvents = {
  joinProject: 'joinProject',
  leaveProject: 'leaveProject',
} as const;

export type ServerEvent = (typeof serverEvents)[keyof typeof serverEvents];
export type ClientEvent = (typeof clientEvents)[keyof typeof clientEvents];

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  /** Precomputed deep link — the bell is a dumb <Link>, so old rows keep working. */
  url: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationCountPayload {
  unread: number;
}
