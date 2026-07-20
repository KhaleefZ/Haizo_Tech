/**
 * Socket.IO wiring.
 *
 * Attached to the same HTTP server as Express (one port, one process). Every
 * connection is authenticated at the handshake by the SAME cookie the REST API
 * uses — an unauthenticated socket never reaches a handler.
 *
 * Domain events (chat, presence, notifications) arrive in later phases. What
 * ships in Phase 3 is the security spine: authenticated handshake + a sweep that
 * disconnects a socket once its access token lapses, so a long-lived connection
 * can't outlive the session that authorized it. The client re-handshakes after
 * refreshing, exactly as it would after any drop.
 */
import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { config } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { authenticateHandshake, SocketAuthError } from './auth.js';
import { authenticateVisitorHandshake, VisitorSocketAuthError } from './visitorAuth.js';
import { setIo, conversationRoom, supportRoom, SUPPORT_AGENTS_ROOM } from './io.js';
import { markOnline, markOffline, onlineUserIds } from './presence.js';
import { prisma } from '../lib/prisma.js';
import type { AuthUser } from '../middleware/auth.js';

interface SocketData {
  kind: 'staff' | 'visitor';
  // Staff sockets.
  user?: AuthUser;
  expiresAt?: number;
  // Visitor sockets.
  visitor?: { visitorId: string; sessionId: string };
}

const EXPIRY_SWEEP_MS = 60_000;

export function attachSockets(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigins, credentials: true },
  });
  // Expose it to the service layer for real-time notification pushes.
  setIo(io);

  io.use((socket, next) => {
    const data = socket.data as SocketData;

    // A visitor presents `auth: { visitorToken }` and NEVER a cookie. Route it to
    // the visitor verifier (separate key + audience) — it can never be mistaken
    // for a staff session.
    const auth = socket.handshake.auth as { visitorToken?: string } | undefined;
    if (auth?.visitorToken) {
      try {
        data.kind = 'visitor';
        data.visitor = authenticateVisitorHandshake(socket.handshake);
        return next();
      } catch (err) {
        if (err instanceof VisitorSocketAuthError) return next(new Error('unauthorized'));
        logger.error({ err }, 'Visitor socket auth failed unexpectedly');
        return next(new Error('unauthorized'));
      }
    }

    authenticateHandshake(socket.handshake)
      .then(({ user, expiresAt }) => {
        data.kind = 'staff';
        data.user = user;
        data.expiresAt = expiresAt;
        next();
      })
      .catch((err: unknown) => {
        // A refused handshake is expected traffic (expired tab, logged-out user),
        // not a server fault — surface a clean message, keep internals private.
        if (err instanceof SocketAuthError) return next(new Error('unauthorized'));
        logger.error({ err }, 'Socket auth failed unexpectedly');
        next(new Error('unauthorized'));
      });
  });

  io.on('connection', (socket) => {
    const data = socket.data as SocketData;

    // Visitors get exactly ONE room — their own support session — and nothing
    // else. No user_/conv_/presence/typing. This is the whole isolation guarantee.
    if (data.kind === 'visitor' && data.visitor) {
      void socket.join(supportRoom(data.visitor.sessionId));
      logger.debug({ sessionId: data.visitor.sessionId, socketId: socket.id }, 'visitor socket connected');
      return;
    }

    const user = data.user!;
    // Personal room, so a later phase can target a specific user without tracking
    // socket ids. Disjoint from the chat/presence prefixes reserved in the plan.
    void socket.join(`user_${user.id}`);
    // Staff watch the support inbox in real time.
    void socket.join(SUPPORT_AGENTS_ROOM);
    logger.debug({ userId: user.id, socketId: socket.id }, 'socket connected');

    // Join every conversation the user belongs to, so chat messages reach them in
    // real time. New conversations opened mid-session add the socket via
    // joinUserToConversation().
    prisma.conversationMember
      .findMany({ where: { userId: user.id }, select: { conversationId: true } })
      .then((memberships) => {
        for (const m of memberships) void socket.join(conversationRoom(m.conversationId));
      })
      .catch((err: unknown) => logger.error({ err, userId: user.id }, 'chat room join failed'));

    // Presence: send this socket the current online set, and tell everyone else if
    // the user just came online (first tab).
    socket.emit('presence:state', onlineUserIds());
    if (markOnline(user.id)) io.emit('presence:update', { userId: user.id, status: 'online' });
    // A late presence consumer can ask for a fresh snapshot at any time.
    socket.on('presence:get', () => socket.emit('presence:state', onlineUserIds()));

    // Typing indicators are ephemeral and never persisted. Only relay to a room
    // the socket is actually a member of, so a client can't spoof typing into a
    // conversation it isn't in.
    const relayTyping = (event: 'chat:typing' | 'chat:stop_typing') => (payload: unknown) => {
      const convId = (payload as { conversationId?: unknown })?.conversationId;
      if (typeof convId !== 'string' || !socket.rooms.has(conversationRoom(convId))) return;
      socket.to(conversationRoom(convId)).emit(event, {
        conversationId: convId,
        userId: user.id,
        name: user.name,
      });
    };
    socket.on('chat:typing', relayTyping('chat:typing'));
    socket.on('chat:stop_typing', relayTyping('chat:stop_typing'));

    socket.on('disconnect', () => {
      if (markOffline(user.id)) io.emit('presence:update', { userId: user.id, status: 'offline' });
    });
  });

  // Disconnect sockets whose access token has expired since the handshake.
  const sweep = setInterval(() => {
    const nowSec = Math.floor(Date.now() / 1000);
    for (const socket of io.sockets.sockets.values()) {
      const { expiresAt } = socket.data as SocketData;
      if (expiresAt && nowSec >= expiresAt) {
        socket.emit('auth:expired');
        socket.disconnect(true);
      }
    }
  }, EXPIRY_SWEEP_MS);
  sweep.unref();

  return io;
}
