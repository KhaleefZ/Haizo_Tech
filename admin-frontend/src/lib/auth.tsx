'use client';

/**
 * The single source of truth for "who is signed in".
 *
 * `me` is a React Query so the whole app shares one cached answer and one loading
 * state — a 401 resolves to `null` (signed out) rather than an error, because
 * "not logged in" is a normal state here, not a failure. The route guard and the
 * header both read this; neither calls the API itself.
 */
import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CurrentUser } from '@haizo/types';
import { api, ApiError } from './api';

const ME_KEY = ['auth', 'me'] as const;

interface AuthContextValue {
  user: CurrentUser | null;
  /** True only during the first resolution, so the guard can show a spinner once. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<CurrentUser | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await api.auth.me();
      } catch (err) {
        // 401 is "signed out", a valid answer. Anything else is a real problem
        // and should surface as an error, not be masked as logged-out.
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    // The session is authoritative; don't refetch it on every window focus.
    staleTime: 60_000,
    retry: false,
  });

  const login = React.useCallback(
    async (email: string, password: string) => {
      const user = await api.auth.login(email, password);
      // Seed the cache from the login response so the UI updates without a round-trip.
      qc.setQueryData(ME_KEY, user);
      return user;
    },
    [qc],
  );

  const logout = React.useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      // Whatever the server said, locally the session is over. Clear everything so
      // no other query keeps showing data from the previous user.
      qc.setQueryData(ME_KEY, null);
      qc.clear();
    }
  }, [qc]);

  const value = React.useMemo<AuthContextValue>(
    () => ({ user: data ?? null, isLoading, login, logout }),
    [data, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>.');
  return ctx;
}
