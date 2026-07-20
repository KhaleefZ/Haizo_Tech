/**
 * Structural guards that don't need the database — they inspect the router and
 * the spec directly.
 *
 *   1. Drift: every mounted route is in the spec (no phantom endpoints) and every
 *      spec operation is mounted (no unimplemented contract). This is the hard
 *      version promised in Phase 3 — it fails a PR rather than reporting softly.
 *   2. Gate coverage: every route that isn't on the explicit public allow-list
 *      must carry requireAuth, requireRole or requireCsrf. A new admin route that
 *      forgets its gate fails here — you cannot ship an open write endpoint by
 *      omission, only by deliberately adding it to the allow-list below (which
 *      shows up in review).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Router } from 'express';
import routesRouter from '../routes/index.js';
import { SPEC_PATH } from '../app.js';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

interface MountedRoute {
  method: string;
  path: string;
  handlers: string[];
}

/** Express ':slug' and OpenAPI '{slug}' both normalise to ':slug'. */
function canonical(method: string, path: string): string {
  return `${method.toUpperCase()} ${path.replace(/\{([^}]+)\}/g, ':$1')}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function walk(router: Router, out: MountedRoute[] = []): MountedRoute[] {
  for (const layer of (router as any).stack as any[]) {
    if (layer.route) {
      const path: string = layer.route.path;
      const handlers: string[] = layer.route.stack.map((s: any) => s.handle.name as string);
      for (const method of Object.keys(layer.route.methods)) {
        if (HTTP_METHODS.includes(method)) out.push({ method, path, handlers });
      }
    } else if (layer.handle?.stack) {
      walk(layer.handle as Router, out);
    }
  }
  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Extract (method, path) for every operation declared in the spec's paths block. */
function specOperations(): { method: string; path: string }[] {
  const lines = readFileSync(SPEC_PATH, 'utf8').split('\n');
  const ops: { method: string; path: string }[] = [];
  let inPaths = false;
  let currentPath: string | null = null;

  for (const line of lines) {
    if (/^paths:\s*$/.test(line)) { inPaths = true; continue; }
    if (inPaths && /^\S/.test(line)) break; // dedent to col 0 → left the paths block
    if (!inPaths) continue;

    const pathMatch = /^ {2}(\/\S*):\s*$/.exec(line);
    if (pathMatch) { currentPath = pathMatch[1] ?? null; continue; }

    const methodMatch = /^ {4}(get|post|put|patch|delete):\s*$/.exec(line);
    if (methodMatch && currentPath) ops.push({ method: methodMatch[1]!, path: currentPath });
  }
  return ops;
}

// Routes intentionally open. Everything else must be gated. Adding a line here is
// a deliberate, reviewable act — which is the point.
const PUBLIC_ROUTES = new Set([
  'GET /health',
  'GET /services',
  'GET /services/:slug',
  'GET /work-categories',
  'GET /industries',
  'GET /testimonials',
  'GET /work',
  'GET /blog',
  'POST /inquiries',
  'POST /analytics/pageview',
  'POST /auth/login',
  // Public visitor support: anonymous by design.
  'GET /support/availability',
  'POST /support/session',
]);

// requireVisitor is a real gate — it verifies a scoped visitor bearer token, so
// the visitor message routes count as gated, not open.
const GATE_NAMES = ['requireAuth', 'requireRole', 'requireCsrf', 'requireVisitor'];

const mounted = walk(routesRouter);

describe('contract drift', () => {
  const specSet = new Set(specOperations().map((o) => canonical(o.method, o.path)));
  const mountedSet = new Set(mounted.map((r) => canonical(r.method, r.path)));

  it('mounts no route the spec does not declare (no phantom endpoints)', () => {
    const phantom = [...mountedSet].filter((r) => !specSet.has(r));
    expect(phantom).toEqual([]);
  });

  it('implements every operation the spec declares (no dead contract)', () => {
    const unimplemented = [...specSet].filter((r) => !mountedSet.has(r));
    expect(unimplemented).toEqual([]);
  });
});

describe('route gate coverage', () => {
  it('gates every route that is not explicitly public', () => {
    const ungated = mounted
      .filter((r) => !PUBLIC_ROUTES.has(canonical(r.method, r.path)))
      .filter((r) => !r.handlers.some((h) => GATE_NAMES.includes(h)))
      .map((r) => canonical(r.method, r.path));

    expect(ungated).toEqual([]);
  });

  it('found the routes at all (walker sanity)', () => {
    // If the walker silently returned nothing, the coverage check above would
    // pass vacuously — assert it actually saw the surface.
    expect(mounted.length).toBeGreaterThanOrEqual(11);
    expect(mounted.map((r) => canonical(r.method, r.path))).toContain('GET /auth/me');
  });
});
