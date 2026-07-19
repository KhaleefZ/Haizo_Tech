/**
 * The "service-layer decorator" for the activity feed — implemented as one
 * post-response middleware so producers don't each have to remember to log.
 *
 * After any successful admin mutation it appends an ActivityEvent with the actor
 * (read at finish time, once requireAuth has populated req.user), the action,
 * the entity type parsed from the path, and a human label lifted from the JSON
 * response body. Recording is fire-and-forget and never affects the response.
 */
import type { NextFunction, Request, Response } from 'express';
import { activityService } from '../services/activity.service.js';

const RESOURCE_TO_ENTITY: Record<string, string> = {
  services: 'service',
  work: 'work',
  blog: 'blog',
  testimonials: 'testimonial',
  industries: 'industry',
  'work-categories': 'category',
  projects: 'project',
  columns: 'column',
  tasks: 'task',
  clients: 'client',
  announcements: 'announcement',
  inquiries: 'inquiry',
  users: 'user',
};

const ACTION_BY_METHOD: Record<string, string> = {
  POST: 'created',
  PATCH: 'updated',
  PUT: 'updated',
  DELETE: 'deleted',
};

/** Pick the last resource segment (so nested creates map to the child entity). */
function parsePath(originalUrl: string): { entityType: string; entityId: string | null } | null {
  const path = originalUrl.split('?')[0] ?? '';
  const segs = path.split('/').filter(Boolean);
  const adminIdx = segs.indexOf('admin');
  if (adminIdx === -1) return null;
  const rest = segs.slice(adminIdx + 1);

  let entityType: string | null = null;
  let entityId: string | null = null;
  for (let i = 0; i < rest.length; i++) {
    const mapped = RESOURCE_TO_ENTITY[rest[i]!];
    if (mapped) {
      entityType = mapped;
      const next = rest[i + 1];
      entityId = next && !RESOURCE_TO_ENTITY[next] ? next : null;
    }
  }
  return entityType ? { entityType, entityId } : null;
}

function labelFrom(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  for (const key of ['name', 'title', 'organization', 'author', 'slug'] as const) {
    if (typeof b[key] === 'string') return b[key] as string;
  }
  return null;
}

export function activityLogger(req: Request, res: Response, next: NextFunction) {
  const action = ACTION_BY_METHOD[req.method];
  const parsed = action ? parsePath(req.originalUrl) : null;
  if (!action || !parsed) return next();

  // Capture the response body for its label without changing behaviour.
  let captured: unknown;
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    captured = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    if (res.statusCode >= 400) return; // only successful mutations
    const capturedId =
      captured && typeof captured === 'object' ? (captured as { id?: string }).id : undefined;
    void activityService.record({
      actorId: req.user?.id ?? null,
      actorName: req.user?.name ?? null,
      action,
      entityType: parsed.entityType,
      entityId: parsed.entityId ?? capturedId ?? null,
      entityLabel: labelFrom(captured),
      path: (req.originalUrl.split('?')[0] ?? null),
    });
  });

  next();
}
