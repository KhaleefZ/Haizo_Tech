'use client';

/**
 * Browser-side client for the public support widget.
 *
 * The visitor's session token lives in localStorage so a returning tab resumes
 * the same conversation. It's a low-stakes, session-scoped token (it can only act
 * within one anonymous support thread), so localStorage is an acceptable home —
 * unlike the staff session, which is HttpOnly precisely because it isn't.
 */
import type { SupportMessage, SupportStart, SupportThread } from '@haizo/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';
const BASE = `${API}/v1`;
const TOKEN_KEY = 'hz_support_token';

export const supportApiOrigin = API;

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function setToken(t: string) {
  try {
    localStorage.setItem(TOKEN_KEY, t);
  } catch {
    /* private mode / disabled storage — the session just won't persist */
  }
}
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function availability(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/support/availability`, { headers: { accept: 'application/json' } });
    if (!res.ok) return false;
    return Boolean((await res.json()).online);
  } catch {
    return false;
  }
}

export async function startSession(input: { name?: string; email?: string; message?: string }): Promise<SupportStart> {
  const res = await fetch(`${BASE}/support/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Could not start a support session');
  const data = (await res.json()) as SupportStart;
  setToken(data.token);
  return data;
}

/** Returns null (and forgets the token) if there's no valid session to resume. */
export async function getThread(): Promise<SupportThread | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${BASE}/support/messages`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
    });
    if (res.status === 401 || res.status === 404) {
      clearToken();
      return null;
    }
    if (!res.ok) return null;
    return (await res.json()) as SupportThread;
  } catch {
    return null; // network blip — the socket will re-sync on the next connect
  }
}

/**
 * Offline-hours fallback: when no agent is around, the widget collects contact
 * details and files them as a normal Inquiry so the question isn't lost.
 */
export async function submitInquiry(input: { name: string; email: string; message: string }): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/inquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ ...input, consent: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function postMessage(body: string, clientNonce: string): Promise<SupportMessage> {
  const token = getToken();
  if (!token) throw new Error('No support session');
  const res = await fetch(`${BASE}/support/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ body, clientNonce }),
  });
  if (!res.ok) throw new Error('Could not send message');
  return (await res.json()) as SupportMessage;
}
