'use client';

/**
 * The admin's single Socket.IO connection.
 *
 * Auth rides the SAME HttpOnly cookie as the REST client — `withCredentials`
 * sends it on the handshake, so there's no token to manage here. One lazily
 * created connection is shared across the app; components subscribe to events
 * with `useSocketEvent` and never touch the socket directly.
 */
import * as React from 'react';
import { io, type Socket } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API, {
      withCredentials: true,
      // Reconnect quietly after a drop; the handshake re-runs with the current
      // cookie, so a session that refreshed in the meantime just works.
      reconnection: true,
      reconnectionDelay: 500,
    });
  }
  return socket;
}

/**
 * Subscribe to a socket event for the lifetime of the component. The handler is
 * kept in a ref so re-renders don't churn the listener; only `event` re-binds.
 */
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void): void {
  const ref = React.useRef(handler);
  React.useEffect(() => {
    ref.current = handler;
  });
  React.useEffect(() => {
    const s = getSocket();
    const fn = (payload: T) => ref.current(payload);
    s.on(event, fn);
    return () => {
      s.off(event, fn);
    };
  }, [event]);
}
