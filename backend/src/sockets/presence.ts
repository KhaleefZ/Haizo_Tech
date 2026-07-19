/**
 * In-memory presence: who is online right now.
 *
 * A user is "online" while they hold at least one connected socket (multiple tabs
 * count once). This lives in process memory, which is correct for the single-VPS,
 * single-instance deployment the plan pins (Socket.IO isn't clustered here). If a
 * second instance is ever added, this moves to a shared store — until then, memory
 * is the simplest thing that's right.
 */
const socketCounts = new Map<string, number>();

/** Register a new socket for a user. Returns true if they just came online (0→1). */
export function markOnline(userId: string): boolean {
  const next = (socketCounts.get(userId) ?? 0) + 1;
  socketCounts.set(userId, next);
  return next === 1;
}

/** Drop a socket for a user. Returns true if they just went offline (→0). */
export function markOffline(userId: string): boolean {
  const next = (socketCounts.get(userId) ?? 1) - 1;
  if (next <= 0) {
    socketCounts.delete(userId);
    return true;
  }
  socketCounts.set(userId, next);
  return false;
}

export function onlineUserIds(): string[] {
  return [...socketCounts.keys()];
}

export function isOnline(userId: string): boolean {
  return socketCounts.has(userId);
}
