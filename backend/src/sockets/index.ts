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
import type { AuthUser } from '../middleware/auth.js';

interface SocketData {
  user: AuthUser;
  expiresAt: number;
}

const EXPIRY_SWEEP_MS = 60_000;

export function attachSockets(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigins, credentials: true },
  });

  io.use((socket, next) => {
    authenticateHandshake(socket.handshake)
      .then(({ user, expiresAt }) => {
        const data = socket.data as SocketData;
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
    const { user } = socket.data as SocketData;
    // Personal room, so a later phase can target a specific user without tracking
    // socket ids. Disjoint from the chat/presence prefixes reserved in the plan.
    void socket.join(`user_${user.id}`);
    logger.debug({ userId: user.id, socketId: socket.id }, 'socket connected');
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
