/**
 * Team chat end to end: REST (open DM, post, history), idempotent sends via
 * clientNonce, membership authorization, and a real Socket.IO round trip proving
 * a posted message reaches another member in real time.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createServer, type Server as HttpServer } from 'node:http';
import { io as ioClient, type Socket } from 'socket.io-client';
import { createApp } from '../app.js';
import { attachSockets } from '../sockets/index.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/auth/password.js';

const USERS = {
  a: { email: 'phase7-a@haizo.tech', password: 'Sup3rSecret!', name: 'Ava Chat', role: 'SUPER_ADMIN' as const },
  b: { email: 'phase7-b@haizo.tech', password: 'Sup3rSecret!', name: 'Ben Dev', role: 'DEV' as const },
  c: { email: 'phase7-c@haizo.tech', password: 'Sup3rSecret!', name: 'Cid Outsider', role: 'MANAGER' as const },
};

interface Session {
  cookie: string;
  csrf: string;
  at: string;
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
  return { cookie: `hz_at=${jar.hz_at}; hz_csrf=${jar.hz_csrf}`, csrf: jar.hz_csrf!, at: jar.hz_at! };
}

let app: Express;
let server: HttpServer;
let port: number;
let a: Session;
let b: Session;
let c: Session;
let userA: { id: string };
let userB: { id: string };
const convIds = new Set<string>();

beforeAll(async () => {
  for (const u of Object.values(USERS)) {
    const password = await hashPassword(u.password);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { password, role: u.role, name: u.name, tokenVersion: 0 },
      create: { email: u.email, password, name: u.name, role: u.role },
    });
  }
  userA = (await prisma.user.findUniqueOrThrow({ where: { email: USERS.a.email }, select: { id: true } }));
  userB = (await prisma.user.findUniqueOrThrow({ where: { email: USERS.b.email }, select: { id: true } }));

  app = createApp();
  server = createServer(app);
  attachSockets(server); // sets the io singleton so posts emit to conversation rooms
  await new Promise<void>((resolve) => server.listen(0, resolve));
  port = (server.address() as { port: number }).port;

  a = await login(app, USERS.a.email, USERS.a.password);
  b = await login(app, USERS.b.email, USERS.b.password);
  c = await login(app, USERS.c.email, USERS.c.password);
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (convIds.size) {
    await prisma.message.deleteMany({ where: { conversationId: { in: [...convIds] } } });
    await prisma.conversationMember.deleteMany({ where: { conversationId: { in: [...convIds] } } });
    await prisma.conversation.deleteMany({ where: { id: { in: [...convIds] } } });
  }
  await prisma.user.deleteMany({ where: { email: { in: Object.values(USERS).map((u) => u.email) } } });
});

describe('chat REST', () => {
  it('opens a DM idempotently and derives its title from the other member', async () => {
    const open = await request(app)
      .post('/v1/admin/chat/conversations')
      .set('Cookie', a.cookie)
      .set('X-CSRF-Token', a.csrf)
      .send({ userId: userB.id });
    expect(open.status).toBe(200);
    expect(open.body.type).toBe('dm');
    expect(open.body.title).toBe(USERS.b.name);
    expect(open.body.members).toHaveLength(2);
    convIds.add(open.body.id);

    // Same pair → same conversation, not a second one.
    const again = await request(app)
      .post('/v1/admin/chat/conversations')
      .set('Cookie', b.cookie)
      .set('X-CSRF-Token', b.csrf)
      .send({ userId: userA.id });
    expect(again.status).toBe(200);
    expect(again.body.id).toBe(open.body.id);
  });

  it('rejects DMing yourself', async () => {
    const res = await request(app)
      .post('/v1/admin/chat/conversations')
      .set('Cookie', a.cookie)
      .set('X-CSRF-Token', a.csrf)
      .send({ userId: userA.id });
    expect(res.status).toBe(400);
  });

  it('posts and reads back messages; a non-member is 403 and the anonymous caller 401', async () => {
    const open = await request(app)
      .post('/v1/admin/chat/conversations')
      .set('Cookie', a.cookie)
      .set('X-CSRF-Token', a.csrf)
      .send({ userId: userB.id });
    const convId = open.body.id as string;
    convIds.add(convId);

    const post = await request(app)
      .post(`/v1/admin/chat/conversations/${convId}/messages`)
      .set('Cookie', a.cookie)
      .set('X-CSRF-Token', a.csrf)
      .send({ body: 'first message' });
    expect(post.status).toBe(200);
    expect(post.body.body).toBe('first message');
    expect(post.body.sender.id).toBe(userA.id);

    const history = await request(app)
      .get(`/v1/admin/chat/conversations/${convId}/messages`)
      .set('Cookie', b.cookie);
    expect(history.status).toBe(200);
    expect(history.body.data.at(-1).body).toBe('first message');

    // A user who isn't a member can't read it.
    const forbidden = await request(app)
      .get(`/v1/admin/chat/conversations/${convId}/messages`)
      .set('Cookie', c.cookie);
    expect(forbidden.status).toBe(403);

    // No session at all.
    expect((await request(app).get(`/v1/admin/chat/conversations/${convId}/messages`)).status).toBe(401);
  });

  it('dedupes resent messages by clientNonce', async () => {
    const open = await request(app)
      .post('/v1/admin/chat/conversations')
      .set('Cookie', a.cookie)
      .set('X-CSRF-Token', a.csrf)
      .send({ userId: userB.id });
    const convId = open.body.id as string;
    convIds.add(convId);

    const send = () =>
      request(app)
        .post(`/v1/admin/chat/conversations/${convId}/messages`)
        .set('Cookie', a.cookie)
        .set('X-CSRF-Token', a.csrf)
        .send({ body: 'only once', clientNonce: 'nonce-xyz' });

    const first = await send();
    const second = await send();
    expect(second.body.id).toBe(first.body.id);

    const history = await request(app)
      .get(`/v1/admin/chat/conversations/${convId}/messages`)
      .set('Cookie', a.cookie);
    expect(history.body.data.filter((m: { body: string }) => m.body === 'only once')).toHaveLength(1);
  });
});

describe('chat realtime', () => {
  it('delivers a posted message to another member over the socket', async () => {
    // DM must exist before B connects, so B's handshake join puts it in the room.
    const open = await request(app)
      .post('/v1/admin/chat/conversations')
      .set('Cookie', a.cookie)
      .set('X-CSRF-Token', a.csrf)
      .send({ userId: userB.id });
    const convId = open.body.id as string;
    convIds.add(convId);

    const socket: Socket = ioClient(`http://localhost:${port}`, {
      extraHeaders: { Cookie: `hz_at=${b.at}` },
      reconnection: false,
    });
    try {
      await new Promise<void>((resolve, reject) => {
        socket.on('connect', () => resolve());
        socket.on('connect_error', (e) => reject(e));
        setTimeout(() => reject(new Error('socket connect timeout')), 4000);
      });

      const received = new Promise<{ body: string; conversationId: string }>((resolve, reject) => {
        socket.on('chat:message', (m) => resolve(m));
        setTimeout(() => reject(new Error('no realtime message')), 4000);
      });

      await request(app)
        .post(`/v1/admin/chat/conversations/${convId}/messages`)
        .set('Cookie', a.cookie)
        .set('X-CSRF-Token', a.csrf)
        .send({ body: 'realtime hello' });

      const msg = await received;
      expect(msg.conversationId).toBe(convId);
      expect(msg.body).toBe('realtime hello');
    } finally {
      socket.disconnect();
    }
  });
});
