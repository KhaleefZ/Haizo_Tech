/**
 * Admin Services CRUD end to end through the app, including the authorization
 * gates: unauthenticated → 401, wrong role → 403, missing CSRF on a write → 403.
 *
 * One app instance for the file so a login cookie can be reused across requests;
 * the login limiter (10/15min) comfortably covers the two logins we do.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/auth/password.js';

const ADMIN = { email: 'phase4b-admin@haizo.tech', password: 'Sup3rSecret!' };
const DEVU = { email: 'phase4b-dev@haizo.tech', password: 'Sup3rSecret!' };
const SLUG_PREFIX = 'phase4b-';

interface Session {
  cookie: string;
  csrf: string;
}

function jarFromLogin(setCookie: string[] | undefined): Record<string, string> {
  const jar: Record<string, string> = {};
  for (const line of setCookie ?? []) {
    const pair = line.split(';')[0]!;
    const idx = pair.indexOf('=');
    jar[pair.slice(0, idx)] = pair.slice(idx + 1);
  }
  return jar;
}

async function login(app: Express, email: string, password: string): Promise<Session> {
  const res = await request(app).post('/v1/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  const jar = jarFromLogin(res.headers['set-cookie'] as unknown as string[]);
  return { cookie: `hz_at=${jar.hz_at}; hz_csrf=${jar.hz_csrf}`, csrf: jar.hz_csrf! };
}

let app: Express;
let admin: Session;
let dev: Session;

beforeAll(async () => {
  const password = await hashPassword(ADMIN.password);
  await prisma.user.upsert({
    where: { email: ADMIN.email },
    update: { password, role: 'SUPER_ADMIN', tokenVersion: 0, name: 'P4b Admin' },
    create: { email: ADMIN.email, password, name: 'P4b Admin', role: 'SUPER_ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: DEVU.email },
    update: { password, role: 'DEV', tokenVersion: 0, name: 'P4b Dev' },
    create: { email: DEVU.email, password, name: 'P4b Dev', role: 'DEV' },
  });

  app = createApp();
  admin = await login(app, ADMIN.email, ADMIN.password);
  dev = await login(app, DEVU.email, DEVU.password);
});

afterAll(async () => {
  await prisma.service.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
  await prisma.user.deleteMany({ where: { email: { in: [ADMIN.email, DEVU.email] } } });
  await prisma.$disconnect();
});

describe('authorization', () => {
  it('401 without a session', async () => {
    const res = await request(app).get('/v1/admin/services');
    expect(res.status).toBe(401);
  });

  it('403 for a DEV (not a content manager)', async () => {
    const res = await request(app).get('/v1/admin/services').set('Cookie', dev.cookie);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('403 for a write without the CSRF header', async () => {
    const res = await request(app)
      .post('/v1/admin/services')
      .set('Cookie', admin.cookie)
      .send({ slug: `${SLUG_PREFIX}nocsrf`, title: 'No CSRF', summary: 'Should not be created' });
    expect(res.status).toBe(403);
  });
});

describe('services CRUD', () => {
  let createdId: string;

  it('creates a draft service (publishedAt null)', async () => {
    const res = await request(app)
      .post('/v1/admin/services')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({
        slug: `${SLUG_PREFIX}draft`,
        title: 'Draft Service',
        summary: 'A service created as a draft.',
        stack: ['TypeScript'],
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ slug: `${SLUG_PREFIX}draft`, published: false });
    expect(res.body.publishedAt).toBeNull();
    expect(res.body.stack).toEqual(['TypeScript']);
    createdId = res.body.id;
  });

  it('rejects a duplicate slug with 409', async () => {
    const res = await request(app)
      .post('/v1/admin/services')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ slug: `${SLUG_PREFIX}draft`, title: 'Dup', summary: 'Duplicate slug attempt.' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('creates a published service with a publishedAt stamp', async () => {
    const res = await request(app)
      .post('/v1/admin/services')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({
        slug: `${SLUG_PREFIX}live`,
        title: 'Live Service',
        summary: 'Published on creation.',
        published: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.published).toBe(true);
    expect(res.body.publishedAt).toBeTruthy();
  });

  it('lists services including drafts', async () => {
    const res = await request(app).get('/v1/admin/services').set('Cookie', admin.cookie);
    expect(res.status).toBe(200);
    const slugs = res.body.data.map((s: { slug: string }) => s.slug);
    expect(slugs).toContain(`${SLUG_PREFIX}draft`);
    expect(slugs).toContain(`${SLUG_PREFIX}live`);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
  });

  it('gets one by id', async () => {
    const res = await request(app)
      .get(`/v1/admin/services/${createdId}`)
      .set('Cookie', admin.cookie);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
  });

  it('updates the title and stamps publishedAt when publishing', async () => {
    const res = await request(app)
      .patch(`/v1/admin/services/${createdId}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ title: 'Draft Service (edited)', published: true });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Draft Service (edited)');
    expect(res.body.published).toBe(true);
    expect(res.body.publishedAt).toBeTruthy();
  });

  it('clears publishedAt when unpublishing', async () => {
    const res = await request(app)
      .patch(`/v1/admin/services/${createdId}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ published: false });
    expect(res.status).toBe(200);
    expect(res.body.published).toBe(false);
    expect(res.body.publishedAt).toBeNull();
  });

  it('404 when updating a missing service', async () => {
    const res = await request(app)
      .patch(`/v1/admin/services/does-not-exist`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ title: 'nope' });
    expect(res.status).toBe(404);
  });

  it('deletes, then the row is gone', async () => {
    const del = await request(app)
      .delete(`/v1/admin/services/${createdId}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf);
    expect(del.status).toBe(204);

    const after = await request(app)
      .get(`/v1/admin/services/${createdId}`)
      .set('Cookie', admin.cookie);
    expect(after.status).toBe(404);
  });
});
