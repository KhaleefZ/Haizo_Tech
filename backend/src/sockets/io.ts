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

/** Room name for a chat conversation. Members join it on connect (see sockets/index.ts). */
export const conversationRoom = (conversationId: string): string => `conv_${conversationId}`;

/** Emit an event to everyone currently in a conversation. */
export function emitToConversation(conversationId: string, event: string, payload: unknown): void {
  io?.to(conversationRoom(conversationId)).emit(event, payload);
}

/**
 * Add a user's live sockets to a conversation room — used when they're added to a
 * new conversation mid-session so they receive its messages without reconnecting.
 */
export function joinUserToConversation(userId: string, conversationId: string): void {
  void io?.in(`user_${userId}`).socketsJoin(conversationRoom(conversationId));
}
