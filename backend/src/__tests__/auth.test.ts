/**
 * Cookie-auth behaviour, end to end through the real app against the dev database.
 *
 * A fresh `createApp()` per test gives each its own rate-limiter, so the login
 * limiter can't accumulate across tests and surprise us with a 429.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/auth/password.js';

const EMAIL = 'phase3-authtest@haizo.tech';
const PASSWORD = 'Sup3rSecret!';

/** Pull one cookie's value out of a Set-Cookie header array. */
function cookieValue(setCookie: string[] | undefined, name: string): string | null {
  for (const line of setCookie ?? []) {
    const m = new RegExp(`^${name}=([^;]*)`).exec(line);
    if (m) return m[1] ?? null;
  }
  return null;
}

function cookieAttrs(setCookie: string[] | undefined, name: string): string | null {
  return (setCookie ?? []).find((l) => l.startsWith(`${name}=`)) ?? null;
}

beforeAll(async () => {
  const password = await hashPassword(PASSWORD);
  await prisma.user.upsert({
    where: { email: EMAIL },
    update: { password, tokenVersion: 0, role: 'MANAGER', name: 'Auth Test' },
    create: { email: EMAIL, password, name: 'Auth Test', role: 'MANAGER' },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  await prisma.$disconnect();
});

describe('POST /v1/auth/login', () => {
  it('rejects a wrong password with 401 and sets no cookies', async () => {
    const res = await request(createApp())
      .post('/v1/auth/login')
      .send({ email: EMAIL, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('does not reveal whether an email exists', async () => {
    const res = await request(createApp())
      .post('/v1/auth/login')
      .send({ email: 'nobody@haizo.tech', password: 'whatever12' });
    expect(res.status).toBe(401);
    // Same generic message as a wrong password — no user enumeration.
    expect(res.body.error.message).toMatch(/incorrect/i);
  });

  it('sets hz_at, hz_rt and hz_csrf and returns the user (no token in body)', async () => {
    const res = await request(createApp())
      .post('/v1/auth/login')
      .send({ email: EMAIL, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: EMAIL, role: 'MANAGER', name: 'Auth Test' });
    expect(res.body.password).toBeUndefined();
    expect(res.body.token).toBeUndefined();

    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(cookieValue(setCookie, 'hz_at')).toBeTruthy();
    expect(cookieValue(setCookie, 'hz_rt')).toBeTruthy();
    expect(cookieValue(setCookie, 'hz_csrf')).toBeTruthy();

    // The access cookie is HttpOnly; the CSRF cookie is deliberately NOT.
    expect(cookieAttrs(setCookie, 'hz_at')).toMatch(/HttpOnly/i);
    expect(cookieAttrs(setCookie, 'hz_csrf')).not.toMatch(/HttpOnly/i);
    // The refresh cookie is path-scoped so it isn't sent on ordinary calls.
    expect(cookieAttrs(setCookie, 'hz_rt')).toMatch(/Path=\/v1\/auth/i);
  });
});

describe('GET /v1/auth/me', () => {
  it('returns 401 without a session', async () => {
    const res = await request(createApp()).get('/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 for a garbage token', async () => {
    const res = await request(createApp())
      .get('/v1/auth/me')
      .set('Cookie', 'hz_at=not-a-real-jwt');
    expect(res.status).toBe(401);
  });

  it('returns the current user when the access cookie is present', async () => {
    const app = createApp();
    const login = await request(app).post('/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
    const at = cookieValue(login.headers['set-cookie'] as unknown as string[], 'hz_at');

    const res = await request(app).get('/v1/auth/me').set('Cookie', `hz_at=${at}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: EMAIL, role: 'MANAGER' });
  });
});

describe('CSRF-guarded auth routes', () => {
  it('logout without the CSRF header is 403', async () => {
    const app = createApp();
    const login = await request(app).post('/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
    const csrf = cookieValue(login.headers['set-cookie'] as unknown as string[], 'hz_csrf')!;

    const res = await request(app).post('/v1/auth/logout').set('Cookie', `hz_csrf=${csrf}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('logout with matching cookie + header clears the cookies', async () => {
    const app = createApp();
    const login = await request(app).post('/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
    const csrf = cookieValue(login.headers['set-cookie'] as unknown as string[], 'hz_csrf')!;

    const res = await request(app)
      .post('/v1/auth/logout')
      .set('Cookie', `hz_csrf=${csrf}`)
      .set('X-CSRF-Token', csrf);

    expect(res.status).toBe(204);
    // Cleared cookies come back with an expiry in the past.
    const cleared = (res.headers['set-cookie'] as unknown as string[]) ?? [];
    expect(cleared.some((c) => c.startsWith('hz_at=') && /Expires=Thu, 01 Jan 1970/i.test(c))).toBe(true);
  });
});

describe('POST /v1/auth/refresh', () => {
  it('is 403 without the CSRF header even with a valid refresh cookie', async () => {
    const app = createApp();
    const login = await request(app).post('/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
    const setCookie = login.headers['set-cookie'] as unknown as string[];
    const rt = cookieValue(setCookie, 'hz_rt')!;

    const res = await request(app).post('/v1/auth/refresh').set('Cookie', `hz_rt=${rt}`);
    expect(res.status).toBe(403);
  });

  it('rotates the session when given a valid refresh cookie + CSRF header', async () => {
    const app = createApp();
    const login = await request(app).post('/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
    const setCookie = login.headers['set-cookie'] as unknown as string[];
    const rt = cookieValue(setCookie, 'hz_rt')!;
    const csrf = cookieValue(setCookie, 'hz_csrf')!;

    const res = await request(app)
      .post('/v1/auth/refresh')
      .set('Cookie', `hz_rt=${rt}; hz_csrf=${csrf}`)
      .set('X-CSRF-Token', csrf);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: EMAIL });
    expect(cookieValue(res.headers['set-cookie'] as unknown as string[], 'hz_at')).toBeTruthy();
  });

  it('is 401 with the CSRF header but no refresh cookie', async () => {
    const res = await request(createApp())
      .post('/v1/auth/refresh')
      .set('Cookie', 'hz_csrf=abc')
      .set('X-CSRF-Token', 'abc');
    expect(res.status).toBe(401);
  });
});

describe('tokenVersion revocation', () => {
  it('invalidates an access token once the user tokenVersion is bumped', async () => {
    const app = createApp();
    const login = await request(app).post('/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
    const at = cookieValue(login.headers['set-cookie'] as unknown as string[], 'hz_at')!;

    // Session works...
    expect((await request(app).get('/v1/auth/me').set('Cookie', `hz_at=${at}`)).status).toBe(200);

    // ...then "log out everywhere".
    await prisma.user.update({ where: { email: EMAIL }, data: { tokenVersion: { increment: 1 } } });

    const after = await request(app).get('/v1/auth/me').set('Cookie', `hz_at=${at}`);
    expect(after.status).toBe(401);

    // Reset for any later runs.
    await prisma.user.update({ where: { email: EMAIL }, data: { tokenVersion: 0 } });
  });
});
