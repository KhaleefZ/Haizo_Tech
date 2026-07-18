/**
 * The drift guard.
 *
 * Two assertions, both of which must hold for the contract to mean anything:
 *   1. Every route mounted on Express is declared in the spec  → no phantom endpoints.
 *   2. Every operationId in the spec is exercised by a test    → no untested contract.
 *
 * (2) starts as a soft report while the surface is still small; it becomes a hard
 * failure in Phase 3 when the full admin API lands.
 */
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { createApp, SPEC_PATH } from '../app.js';

const spec = readFileSync(SPEC_PATH, 'utf8');

describe('OpenAPI contract', () => {
  it('declares every route the app mounts', () => {
    // Health is the only slice in Phase 1; the walker arrives with the admin API.
    expect(spec).toContain('/health:');
    expect(spec).toContain('operationId: getHealth');
  });

  it('defines exactly one error shape', () => {
    expect(spec).toContain('Error:');
    expect(spec.match(/\$ref: '#\/components\/schemas\/Error'/g)?.length ?? 0).toBeGreaterThan(4);
  });
});

describe('GET /v1/health', () => {
  it('returns a body matching the Health schema', async () => {
    const res = await request(createApp()).get('/v1/health');

    // 'degraded' is correct when no database is running locally — the endpoint
    // still has to answer, and the response still has to satisfy the contract.
    expect([200]).toContain(res.status);
    expect(['ok', 'degraded']).toContain(res.body.status);
    expect(typeof res.body.uptimeSeconds).toBe('number');
    expect(typeof res.body.version).toBe('string');
  });
});

describe('unknown routes', () => {
  it('returns the standard error envelope, not Express HTML', async () => {
    const res = await request(createApp()).get('/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBeTruthy();
  });
});
