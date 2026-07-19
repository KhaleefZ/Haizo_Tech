/**
 * A process-wide handle to the Socket.IO server so the service layer can push
 * real-time events without importing the HTTP wiring. `attachSockets` registers
 * it; anything that isn't running the socket server (tests, one-off scripts)
 * simply sees `null` and skips the emit.
 */
import type { Server } from 'socket.io';

let io: Server | null = null;

export function setIo(server: Server): void {
  io = server;
}

/** Emit an event to a user's personal room, if the socket server is running. */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user_${userId}`).emit(event, payload);
}
