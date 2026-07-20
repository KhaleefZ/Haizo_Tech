/**
 * Public visitor support chat — with the Phase 8 exit criterion front and centre:
 * a visitor token is isolated from staff, both at the JWT layer (wrong key +
 * wrong audience, rejected by the staff verifier) and at the socket layer (a
 * visitor socket joins ONLY its own support room — never user_/conv_/support_agents
 * or another visitor's session).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createServer, type Server as HttpServer } from 'node:http';
import { io as ioClient, type Socket } from 'socket.io-client';
import type { Server as IoServer } from 'socket.io';
import { createApp } from '../app.js';
import { attachSockets } from '../sockets/index.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/auth/password.js';
import { signVisitorToken, verifyVisitorToken } from '../lib/auth/visitorTokens.js';
import { signAccessToken, verifyAccessToken } from '../lib/auth/tokens.js';

const STAFF = { email: 'phase8-agent@haizo.tech', password: 'Sup3rSecret!', name: 'Support Agent' };

let app: Express;
let server: HttpServer;
let io: IoServer;
let port: number;
let staffCookie: string;
let staffCsrf: string;
const sessionIds = new Set<string>();

function url() {
  return `http://localhost:${port}`;
}

async function connectVisitor(token: string): Promise<Socket> {
  const s = ioClient(url(), { auth: { visitorToken: token }, reconnection: false });
  await new Promise<void>((resolve, reject) => {
    s.on('connect', () => resolve());
    s.on('connect_error', (e) => reject(e));
    setTimeout(() => reject(new Error('visitor socket connect timeout')), 4000);
  });
  return s;
}

async function startSession(body: Record<string, unknown> = {}) {
  const res = await request(app).post('/v1/support/session').send(body);
  expect(res.status).toBe(200);
  sessionIds.add(res.body.sessionId);
  return res.body as { token: string; sessionId: string; status: string };
}

beforeAll(async () => {
  const password = await hashPassword(STAFF.password);
  await prisma.user.upsert({
    where: { email: STAFF.email },
    update: { password, role: 'SUPER_ADMIN', name: STAFF.name, tokenVersion: 0 },
    create: { email: STAFF.email, password, name: STAFF.name, role: 'SUPER_ADMIN' },
  });

  app = createApp();
  server = createServer(app);
  io = attachSockets(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  port = (server.address() as { port: number }).port;

  const login = await request(app).post('/v1/auth/login').send({ email: STAFF.email, password: STAFF.password });
  const jar: Record<string, string> = {};
  for (const line of (login.headers['set-cookie'] as unknown as string[]) ?? []) {
    const pair = line.split(';')[0]!;
    const i = pair.indexOf('=');
    jar[pair.slice(0, i)] = pair.slice(i + 1);
  }
  staffCookie = `hz_at=${jar.hz_at}; hz_csrf=${jar.hz_csrf}`;
  staffCsrf = jar.hz_csrf!;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (sessionIds.size) {
    const sessions = await prisma.supportSession.findMany({
      where: { id: { in: [...sessionIds] } },
      select: { visitorId: true },
    });
    await prisma.supportSession.deleteMany({ where: { id: { in: [...sessionIds] } } });
    await prisma.visitor.deleteMany({ where: { id: { in: sessions.map((s) => s.visitorId) } } });
  }
  await prisma.user.deleteMany({ where: { email: STAFF.email } });
});

describe('visitor token isolation (Phase 8 exit criterion)', () => {
  it('the staff verifier rejects a visitor token, and the visitor verifier rejects a staff token', () => {
    const visitorToken = signVisitorToken({ sub: 'v-1', sid: 's-1' });
    expect(() => verifyAccessToken(visitorToken)).toThrow(); // wrong key AND wrong audience

    const staffToken = signAccessToken({ sub: 'u-1', role: 'DEV', tv: 0 });
    expect(() => verifyVisitorToken(staffToken)).toThrow();
  });

  it('a visitor token cannot reach a staff-gated endpoint', async () => {
    const visitorToken = signVisitorToken({ sub: 'v-1', sid: 's-1' });
    const res = await request(app)
      .get('/v1/admin/support/sessions')
      .set('Authorization', `Bearer ${visitorToken}`);
    expect(res.status).toBe(401);
  });

  it('a visitor socket joins ONLY its own support room', async () => {
    const { token, sessionId } = await startSession({ message: 'hello' });
    const socket = await connectVisitor(token);
    try {
      const serverSocket = [...io.sockets.sockets.values()].find(
        (s) => (s.data as { kind?: string }).kind === 'visitor',
      );
      expect(serverSocket).toBeTruthy();
      const rooms = [...serverSocket!.rooms];
      expect(rooms).toContain(`support_${sessionId}`);
      expect(rooms).not.toContain('support_agents');
      expect(rooms.some((r) => r.startsWith('user_'))).toBe(false);
      expect(rooms.some((r) => r.startsWith('conv_'))).toBe(false);
    } finally {
      socket.disconnect();
    }
  });

  it('a visitor receives its own session traffic but never another visitor’s', async () => {
    const s1 = await startSession();
    const s2 = await startSession();
    const v1 = await connectVisitor(s1.token);
    try {
      let gotOwn = false;
      let gotForeign = false;
      v1.on('support:message', (m: { sessionId: string }) => {
        if (m.sessionId === s1.sessionId) gotOwn = true;
        if (m.sessionId === s2.sessionId) gotForeign = true;
      });

      // A message in s2 (emitted to its room + the agents room) must not reach v1.
      await request(app).post('/v1/support/messages').set('Authorization', `Bearer ${s2.token}`).send({ body: 'to s2' });
      // A message in s1 must reach v1.
      await request(app).post('/v1/support/messages').set('Authorization', `Bearer ${s1.token}`).send({ body: 'to s1' });

      await new Promise((r) => setTimeout(r, 500));
      expect(gotOwn).toBe(true);
      expect(gotForeign).toBe(false);
    } finally {
      v1.disconnect();
    }
  });
});

describe('support chat end to end', () => {
  it('starts a session, staff sees it, staff reply reaches the visitor live', async () => {
    const start = await startSession({ name: 'Ann', email: 'ann@example.com', message: 'I need help with billing' });
    expect(start.token).toBeTruthy();
    expect(start.status).toBe('OPEN');

    // Visitor can read their own thread with the token.
    const thread = await request(app).get('/v1/support/messages').set('Authorization', `Bearer ${start.token}`);
    expect(thread.status).toBe(200);
    expect(thread.body.messages[0].from).toBe('visitor');

    // Staff inbox lists it.
    const list = await request(app).get('/v1/admin/support/sessions').set('Cookie', staffCookie);
    expect(list.status).toBe(200);
    expect(list.body.data.some((s: { id: string }) => s.id === start.sessionId)).toBe(true);

    // The visitor is listening; a staff reply arrives in real time.
    const socket = await connectVisitor(start.token);
    try {
      const received = new Promise<{ body: string; from: string }>((resolve, reject) => {
        socket.on('support:message', (m: { body: string; from: string }) => {
          if (m.from === 'staff') resolve(m);
        });
        setTimeout(() => reject(new Error('no staff reply received')), 4000);
      });

      const reply = await request(app)
        .post(`/v1/admin/support/sessions/${start.sessionId}/messages`)
        .set('Cookie', staffCookie)
        .set('X-CSRF-Token', staffCsrf)
        .send({ body: 'Hi Ann — happy to help with billing.' });
      expect(reply.status).toBe(200);
      expect(reply.body.from).toBe('staff');
      expect(reply.body.staffName).toBe(STAFF.name);

      const msg = await received;
      expect(msg.body).toContain('happy to help');
    } finally {
      socket.disconnect();
    }
  });

  it('a visitor message with no session token is rejected', async () => {
    expect((await request(app).post('/v1/support/messages').send({ body: 'hi' })).status).toBe(401);
  });
});
