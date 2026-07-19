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
  await prisma.industry.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
  await prisma.workCategory.deleteMany({ where: { name: { startsWith: 'P4bCat' } } });
  await prisma.testimonial.deleteMany({ where: { author: { startsWith: 'P4bTst' } } });
  await prisma.work.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
  await prisma.blog.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
  await prisma.inquiry.deleteMany({ where: { email: 'p4c-inquiry@test.local' } });
  await prisma.client.deleteMany({ where: { organization: { startsWith: 'P4bClient' } } });
  await prisma.announcement.deleteMany({ where: { title: { startsWith: 'P4bAnn' } } });
  await prisma.user.deleteMany({
    where: { email: { in: [ADMIN.email, DEVU.email, 'p4c-pwtest@test.local'] } },
  });
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

describe('industries CRUD', () => {
  it('401 unauth, 403 for DEV', async () => {
    expect((await request(app).get('/v1/admin/industries')).status).toBe(401);
    expect((await request(app).get('/v1/admin/industries').set('Cookie', dev.cookie)).status).toBe(403);
  });

  it('creates (published by default), rejects duplicate slug, updates, deletes', async () => {
    const create = await request(app)
      .post('/v1/admin/industries')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ slug: `${SLUG_PREFIX}retail`, name: 'Retail', capability: 'POS and inventory.' });
    expect(create.status).toBe(201);
    expect(create.body).toMatchObject({ slug: `${SLUG_PREFIX}retail`, published: true });
    const id = create.body.id;

    const dup = await request(app)
      .post('/v1/admin/industries')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ slug: `${SLUG_PREFIX}retail`, name: 'Dup', capability: 'x'.repeat(5) });
    expect(dup.status).toBe(409);

    const upd = await request(app)
      .patch(`/v1/admin/industries/${id}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ published: false, order: 9 });
    expect(upd.status).toBe(200);
    expect(upd.body).toMatchObject({ published: false, order: 9 });

    const del = await request(app)
      .delete(`/v1/admin/industries/${id}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf);
    expect(del.status).toBe(204);
  });
});

describe('work categories CRUD', () => {
  it('creates, rejects duplicate name, updates order, deletes', async () => {
    const create = await request(app)
      .post('/v1/admin/work-categories')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ name: 'P4bCat Mobile', order: 3 });
    expect(create.status).toBe(201);
    expect(create.body).toMatchObject({ name: 'P4bCat Mobile', order: 3 });
    const id = create.body.id;

    const dup = await request(app)
      .post('/v1/admin/work-categories')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ name: 'P4bCat Mobile' });
    expect(dup.status).toBe(409);

    const upd = await request(app)
      .patch(`/v1/admin/work-categories/${id}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ order: 1 });
    expect(upd.status).toBe(200);
    expect(upd.body.order).toBe(1);

    const del = await request(app)
      .delete(`/v1/admin/work-categories/${id}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf);
    expect(del.status).toBe(204);
  });
});

describe('testimonials CRUD + provenance guard', () => {
  const base = { author: 'P4bTst Alice', quote: 'They shipped exactly what we needed.' };

  it('creates a draft without provenance', async () => {
    const res = await request(app)
      .post('/v1/admin/testimonials')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send(base);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ author: 'P4bTst Alice', published: false });
    expect(res.body.verifiedAt).toBeNull();
  });

  it('REFUSES to publish without sourceUrl + verifiedAt (the anti-fabrication guard)', async () => {
    const res = await request(app)
      .post('/v1/admin/testimonials')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ ...base, author: 'P4bTst Bob', published: true });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toContain('sourceUrl');
    expect(paths).toContain('verifiedAt');
  });

  it('publishes when both sourceUrl and verifiedAt are present', async () => {
    const res = await request(app)
      .post('/v1/admin/testimonials')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({
        ...base,
        author: 'P4bTst Carol',
        published: true,
        sourceUrl: 'https://example.com/review/carol',
        verifiedAt: '2026-01-15T00:00:00.000Z',
      });
    expect(res.status).toBe(201);
    expect(res.body.published).toBe(true);
    expect(res.body.sourceUrl).toBe('https://example.com/review/carol');
  });

  it('refuses to flip an existing draft to published without provenance', async () => {
    const created = await request(app)
      .post('/v1/admin/testimonials')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ ...base, author: 'P4bTst Dave' });
    const id = created.body.id;

    const res = await request(app)
      .patch(`/v1/admin/testimonials/${id}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ published: true });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });
});

describe('work CRUD', () => {
  it('creates, rejects duplicate slug, updates, deletes', async () => {
    const create = await request(app)
      .post('/v1/admin/work')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({
        slug: `${SLUG_PREFIX}case-study`,
        title: 'A Case Study',
        category: 'Web',
        description: 'What we built and the outcome.',
        published: true,
      });
    expect(create.status).toBe(201);
    expect(create.body).toMatchObject({ slug: `${SLUG_PREFIX}case-study`, published: true });
    const id = create.body.id;

    const dup = await request(app)
      .post('/v1/admin/work')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ slug: `${SLUG_PREFIX}case-study`, title: 'Dup', category: 'Web', description: 'again' });
    expect(dup.status).toBe(409);

    const upd = await request(app)
      .patch(`/v1/admin/work/${id}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ title: 'A Case Study (edited)' });
    expect(upd.status).toBe(200);
    expect(upd.body.title).toBe('A Case Study (edited)');

    expect(
      (await request(app).delete(`/v1/admin/work/${id}`).set('Cookie', admin.cookie).set('X-CSRF-Token', admin.csrf)).status,
    ).toBe(204);
  });
});

describe('announcements CRUD', () => {
  it('creates (author = signed-in user), lists, updates, deletes', async () => {
    const create = await request(app)
      .post('/v1/admin/announcements')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ title: 'P4bAnn Kickoff', content: 'We start Monday.', audience: 'MANAGER' });
    expect(create.status).toBe(201);
    expect(create.body).toMatchObject({ title: 'P4bAnn Kickoff', audience: 'MANAGER', authorName: 'P4b Admin' });
    const id = create.body.id;

    const upd = await request(app)
      .patch(`/v1/admin/announcements/${id}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ content: 'We start Tuesday.' });
    expect(upd.status).toBe(200);
    expect(upd.body.content).toBe('We start Tuesday.');

    expect(
      (await request(app).delete(`/v1/admin/announcements/${id}`).set('Cookie', admin.cookie).set('X-CSRF-Token', admin.csrf)).status,
    ).toBe(204);
  });
});

describe('self-service profile + password', () => {
  it('lets any signed-in user edit their own profile', async () => {
    // dev (DEV role) can edit their OWN profile even though they can't manage content.
    const res = await request(app)
      .patch('/v1/admin/me')
      .set('Cookie', dev.cookie)
      .set('X-CSRF-Token', dev.csrf)
      .send({ bio: 'Backend developer.', notificationsEnabled: false });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ bio: 'Backend developer.', notificationsEnabled: false });
    await prisma.user.update({ where: { email: DEVU.email }, data: { bio: null, notificationsEnabled: true } });
  });

  it('changes a password: wrong current → 401, correct → 204 + rotated cookies', async () => {
    const password = await hashPassword('OldPassw0rd!');
    await prisma.user.upsert({
      where: { email: 'p4c-pwtest@test.local' },
      update: { password, tokenVersion: 0, role: 'DEV', name: 'PW Test' },
      create: { email: 'p4c-pwtest@test.local', password, name: 'PW Test', role: 'DEV' },
    });
    const login = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'p4c-pwtest@test.local', password: 'OldPassw0rd!' });
    const jar = jarFromLogin(login.headers['set-cookie'] as unknown as string[]);
    const cookie = `hz_at=${jar.hz_at}; hz_csrf=${jar.hz_csrf}`;
    const csrf = jar.hz_csrf!;

    const wrong = await request(app)
      .post('/v1/admin/me/password')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrf)
      .send({ currentPassword: 'not-the-password', newPassword: 'BrandNew1!' });
    expect(wrong.status).toBe(401);

    const ok = await request(app)
      .post('/v1/admin/me/password')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrf)
      .send({ currentPassword: 'OldPassw0rd!', newPassword: 'BrandNew1!' });
    expect(ok.status).toBe(204);
    // A fresh access cookie is issued so the change doesn't log the user out.
    const setCookie = (ok.headers['set-cookie'] as unknown as string[]) ?? [];
    expect(setCookie.some((c) => c.startsWith('hz_at='))).toBe(true);
  });
});

describe('clients CRUD', () => {
  it('401 unauth, 403 for DEV, full CRUD for a manager-or-above', async () => {
    expect((await request(app).get('/v1/admin/clients')).status).toBe(401);
    expect((await request(app).get('/v1/admin/clients').set('Cookie', dev.cookie)).status).toBe(403);

    const create = await request(app)
      .post('/v1/admin/clients')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ organization: 'P4bClient Acme', contactName: 'Wile E' });
    expect(create.status).toBe(201);
    expect(create.body).toMatchObject({ organization: 'P4bClient Acme', projectCount: 0 });
    const id = create.body.id;

    const upd = await request(app)
      .patch(`/v1/admin/clients/${id}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ email: 'acme@example.com' });
    expect(upd.status).toBe(200);
    expect(upd.body.email).toBe('acme@example.com');

    expect(
      (await request(app).delete(`/v1/admin/clients/${id}`).set('Cookie', admin.cookie).set('X-CSRF-Token', admin.csrf)).status,
    ).toBe(204);
  });
});

describe('team / users (super-admin only)', () => {
  it('403 for a MANAGER-or-below, 200 for a super-admin', async () => {
    // dev session is DEV role → forbidden from user management.
    expect((await request(app).get('/v1/admin/users').set('Cookie', dev.cookie)).status).toBe(403);

    const res = await request(app).get('/v1/admin/users').set('Cookie', admin.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.some((u: { email: string }) => u.email === ADMIN.email)).toBe(true);
    // The password hash must never appear in the user list.
    expect(res.body.data.every((u: Record<string, unknown>) => !('password' in u))).toBe(true);
  });

  it('changes another user’s role but refuses self-role changes', async () => {
    const devUser = await prisma.user.findUnique({ where: { email: DEVU.email } });
    const adminUser = await prisma.user.findUnique({ where: { email: ADMIN.email } });

    const promote = await request(app)
      .patch(`/v1/admin/users/${devUser!.id}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ role: 'MANAGER' });
    expect(promote.status).toBe(200);
    expect(promote.body.role).toBe('MANAGER');
    await prisma.user.update({ where: { id: devUser!.id }, data: { role: 'DEV' } });

    const self = await request(app)
      .patch(`/v1/admin/users/${adminUser!.id}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ role: 'MANAGER' });
    expect(self.status).toBe(403);
  });
});

describe('inquiries inbox', () => {
  it('401 unauth, 403 for DEV', async () => {
    expect((await request(app).get('/v1/admin/inquiries')).status).toBe(401);
    expect((await request(app).get('/v1/admin/inquiries').set('Cookie', dev.cookie)).status).toBe(403);
  });

  it('lists, filters by status, updates status, deletes', async () => {
    const row = await prisma.inquiry.create({
      data: { name: 'Test Lead', email: 'p4c-inquiry@test.local', message: 'Please build us a thing.' },
    });

    const list = await request(app).get('/v1/admin/inquiries?status=NEW').set('Cookie', admin.cookie);
    expect(list.status).toBe(200);
    expect(list.body.data.every((i: { status: string }) => i.status === 'NEW')).toBe(true);
    expect(list.body.data.some((i: { id: string }) => i.id === row.id)).toBe(true);

    const upd = await request(app)
      .patch(`/v1/admin/inquiries/${row.id}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({ status: 'REPLIED' });
    expect(upd.status).toBe(200);
    expect(upd.body.status).toBe('REPLIED');

    const del = await request(app)
      .delete(`/v1/admin/inquiries/${row.id}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf);
    expect(del.status).toBe(204);
  });
});

describe('blog CRUD', () => {
  it('creates with the signed-in user as author, lists, deletes', async () => {
    const create = await request(app)
      .post('/v1/admin/blog')
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .send({
        slug: `${SLUG_PREFIX}first-post`,
        title: 'First Post',
        content: 'Hello world, this is our first post.',
        tags: ['news'],
      });
    expect(create.status).toBe(201);
    // Author is derived from the session, not the request body.
    expect(create.body.authorName).toBe('P4b Admin');
    expect(create.body.published).toBe(false);
    const id = create.body.id;

    const list = await request(app).get('/v1/admin/blog').set('Cookie', admin.cookie);
    expect(list.status).toBe(200);
    expect(list.body.data.some((b: { id: string }) => b.id === id)).toBe(true);

    expect(
      (await request(app).delete(`/v1/admin/blog/${id}`).set('Cookie', admin.cookie).set('X-CSRF-Token', admin.csrf)).status,
    ).toBe(204);
  });
});
