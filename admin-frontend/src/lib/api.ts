/**
 * The admin's browser-side API client.
 *
 * Everything the old admin got wrong lives here now, done right:
 *   • No token in localStorage. Auth rides HttpOnly cookies the browser sends
 *     automatically — `credentials: 'include'` is the whole mechanism. An XSS can
 *     no longer read the session because JavaScript never touches it.
 *   • No `url.replace(/localhost:5001/, '')` hack. The base URL is an env var,
 *     set per environment.
 *   • CSRF is handled by echoing the readable `hz_csrf` cookie in a header on
 *     every mutating request (the double-submit the backend checks).
 *   • A 401 transparently tries ONE refresh and retries, so a user mid-session
 *     never sees a spurious logout when their 15-minute access token lapses.
 */
import type { CurrentUser } from '@haizo/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';
const BASE = `${API}/v1`;

export interface ApiErrorDetail {
  path: string;
  message: string;
}

/** Mirrors the backend's one-and-only error envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(status: number, body: unknown) {
    const err = (body as { error?: { code?: string; message?: string; details?: ApiErrorDetail[] } })
      ?.error;
    super(err?.message ?? `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.code = err?.code ?? 'UNKNOWN';
    this.details = err?.details;
  }
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Never attempt a refresh-retry for these — refresh recursing on itself, or a
// failed login re-driving a login, is a loop, not a recovery.
const NO_REFRESH = new Set(['/auth/refresh', '/auth/login']);

function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = /(?:^|;\s*)hz_csrf=([^;]*)/.exec(document.cookie);
  return match ? decodeURIComponent(match[1]!) : null;
}

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (MUTATING.has(method)) {
    const csrf = readCsrfCookie();
    if (csrf) headers['x-csrf-token'] = csrf;
  }

  return fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function toResult<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

// Single-flight: a burst of calls that all 401 at once triggers exactly one
// refresh, and they all await its result rather than stampeding /auth/refresh.
let inFlightRefresh: Promise<boolean> | null = null;
function refreshOnce(): Promise<boolean> {
  if (!inFlightRefresh) {
    inFlightRefresh = send('POST', '/auth/refresh')
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        inFlightRefresh = null;
      });
  }
  return inFlightRefresh;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res = await send(method, path, body);

  if (res.status === 401 && !NO_REFRESH.has(path)) {
    if (await refreshOnce()) res = await send(method, path, body);
  }

  return toResult<T>(res);
}

export const api = {
  auth: {
    me: () => request<CurrentUser>('GET', '/auth/me'),
    login: (email: string, password: string) =>
      request<CurrentUser>('POST', '/auth/login', { email, password }),
    logout: () => request<void>('POST', '/auth/logout'),
  },
};
