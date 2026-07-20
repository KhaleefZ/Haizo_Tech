'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input } from '@haizo/ui';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { PasswordInput } from '../../components/PasswordInput';

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Already signed in (e.g. navigated here by hand)? Go to the dashboard.
  React.useEffect(() => {
    if (!isLoading && user) router.replace('/');
  }, [isLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (err) {
      // The API gives one generic message for bad credentials; anything else is
      // unexpected and gets a neutral fallback rather than a raw error.
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Email or password is incorrect.'
          : 'Something went wrong. Please try again.',
      );
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-text-strong">HaizoTech Admin</h1>
          <p className="mt-1 text-sm text-text-muted">Sign in to the operations dashboard.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Email">
              <Input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@haizotech.com"
              />
            </Field>

            <Field label="Password">
              <PasswordInput
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" loading={busy} disabled={!email || !password}>
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
