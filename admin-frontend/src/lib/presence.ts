'use client';

/**
 * Client-side presence: which teammates are online right now.
 *
 * A single module-level store subscribes to the socket once (`presence:state`
 * snapshots + `presence:update` deltas) and drives every avatar's dot via
 * `useIsOnline`. useSyncExternalStore keeps React in step without prop-drilling
 * an online set through the chat tree.
 */
import * as React from 'react';
import { getSocket } from './socket';

const online = new Set<string>();
const listeners = new Set<() => void>();
let started = false;

function emitChange() {
  for (const l of listeners) l();
}

function start() {
  if (started) return;
  started = true;
  const s = getSocket();

  s.on('presence:state', (ids: string[]) => {
    online.clear();
    for (const id of ids) online.add(id);
    emitChange();
  });
  s.on('presence:update', (u: { userId: string; status: 'online' | 'offline' }) => {
    if (u.status === 'online') online.add(u.userId);
    else online.delete(u.userId);
    emitChange();
  });
  // Ask for a snapshot now and after any reconnect, in case we attached these
  // listeners after the initial connect already fired presence:state.
  s.emit('presence:get');
  s.on('connect', () => s.emit('presence:get'));
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useIsOnline(userId: string | undefined): boolean {
  React.useEffect(() => {
    start();
  }, []);
  return React.useSyncExternalStore(
    subscribe,
    () => (userId ? online.has(userId) : false),
    () => false,
  );
}
