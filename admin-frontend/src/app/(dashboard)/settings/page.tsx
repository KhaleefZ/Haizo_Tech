'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Field, Input, Skeleton, Textarea, useToast } from '@haizo/ui';
import type { AdminProfile } from '@haizo/types';
import { api, ApiError } from '../../../lib/api';
import { FileUpload } from '../../../components/FileUpload';
import { PasswordInput } from '../../../components/PasswordInput';

const PROFILE_KEY = ['admin', 'profile'] as const;

function ProfileCard({ profile }: { profile: AdminProfile }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = React.useState(profile.name);
  const [bio, setBio] = React.useState(profile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatarUrl ?? '');

  const save = useMutation({
    mutationFn: () =>
      api.me.update({
        name: name.trim(),
        bio: bio.trim() === '' ? null : bio.trim(),
        avatarUrl: avatarUrl.trim() === '' ? null : avatarUrl.trim(),
      }),
    onSuccess: (p) => {
      qc.setQueryData(PROFILE_KEY, p);
      // Header/nav read the auth 'me' query — refresh it so the name/avatar update.
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast({ variant: 'success', title: 'Profile saved' });
    },
    onError: (err) =>
      toast({ variant: 'error', title: 'Could not save', description: err instanceof ApiError ? err.message : 'Try again.' }),
  });

  return (
    <Card>
      <h2 className="font-heading text-lg font-bold text-text-strong">Profile</h2>
      <p className="mt-1 text-sm text-text-muted">Your details, as seen across the admin.</p>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
          </Field>
          <Field label="Email" hint="Contact a super admin to change this.">
            <Input value={profile.email} disabled />
          </Field>
        </div>
        <Field label="Bio">
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={2000} />
        </Field>
        <Field label="Avatar" hint="Paste a URL or upload an image.">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-10 shrink-0 rounded-full border border-border object-cover" />
            ) : null}
            <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} maxLength={500} placeholder="https://…" className="flex-1" />
            <FileUpload accept="image/*" label="Upload" onUploaded={(url) => setAvatarUrl(url)} />
          </div>
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={save.isPending}>Save profile</Button>
        </div>
      </form>
    </Card>
  );
}

const NOTIF_TYPES: { type: string; label: string }[] = [
  { type: 'inquiry.received', label: 'New enquiries' },
  { type: 'task.assigned', label: 'Tasks assigned to me' },
  { type: 'announcement.published', label: 'Announcements' },
  { type: 'blog.published', label: 'Blog posts published' },
  { type: 'work.published', label: 'Work published' },
  { type: 'chat.mention', label: 'Mentions in chat' },
];

function NotificationsCard({ profile }: { profile: AdminProfile }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [enabled, setEnabled] = React.useState(profile.notificationsEnabled);
  const prefs0 = (profile.notificationPrefs ?? {}) as Record<string, boolean>;
  const [prefs, setPrefs] = React.useState<Record<string, boolean>>(prefs0);

  // A type is on unless explicitly set to false.
  const isOn = (type: string) => prefs[type] !== false;
  const setOn = (type: string, on: boolean) => setPrefs((p) => ({ ...p, [type]: on }));

  const save = useMutation({
    mutationFn: () => api.me.update({ notificationsEnabled: enabled, notificationPrefs: prefs }),
    onSuccess: (p) => {
      qc.setQueryData(PROFILE_KEY, p);
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast({ variant: 'success', title: 'Notification settings saved' });
    },
    onError: () => toast({ variant: 'error', title: 'Could not save', description: 'Try again.' }),
  });

  return (
    <Card>
      <h2 className="font-heading text-lg font-bold text-text-strong">Notifications</h2>
      <p className="mt-1 text-sm text-text-muted">
        Turning a type off stops alerts, but it still appears in your notifications history.
      </p>
      <div className="mt-4 space-y-3">
        <label className="flex items-center justify-between rounded-token border border-border bg-bg-tint px-3.5 py-3">
          <span className="text-sm font-semibold text-text-strong">All notifications</span>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="size-4 accent-brand-blue" />
        </label>
        <div className={enabled ? '' : 'pointer-events-none opacity-50'}>
          {NOTIF_TYPES.map((t) => (
            <label key={t.type} className="flex items-center justify-between border-b border-border py-2.5 last:border-b-0">
              <span className="text-sm text-text">{t.label}</span>
              <input
                type="checkbox"
                checked={enabled && isOn(t.type)}
                disabled={!enabled}
                onChange={(e) => setOn(t.type, e.target.checked)}
                className="size-4 accent-brand-blue"
              />
            </label>
          ))}
        </div>
        <div className="flex justify-end pt-1">
          <Button loading={save.isPending} onClick={() => save.mutate()}>Save preferences</Button>
        </div>
      </div>
    </Card>
  );
}

function PasswordCard() {
  const { toast } = useToast();
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const change = useMutation({
    mutationFn: () => api.me.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => {
      setCurrent(''); setNext(''); setConfirm(''); setError(null);
      toast({ variant: 'success', title: 'Password changed', description: 'Other sessions have been signed out.' });
    },
    onError: (err) =>
      setError(err instanceof ApiError && err.status === 401 ? 'Your current password is incorrect.' : 'Could not change your password.'),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < 8) return setError('New password must be at least 8 characters.');
    if (next !== confirm) return setError('New passwords don’t match.');
    change.mutate();
  }

  return (
    <Card>
      <h2 className="font-heading text-lg font-bold text-text-strong">Password</h2>
      <p className="mt-1 text-sm text-text-muted">Changing it signs out your other devices.</p>
      <form className="mt-4 space-y-4" onSubmit={submit}>
        <Field label="Current password">
          <PasswordInput autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password">
            <PasswordInput autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </Field>
        </div>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end">
          <Button type="submit" loading={change.isPending} disabled={!current || !next || !confirm}>
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  const { data: profile, isLoading, isError } = useQuery({ queryKey: PROFILE_KEY, queryFn: () => api.me.get() });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="mb-2">
        <h1 className="font-heading text-2xl font-bold text-text-strong">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">Your account and preferences.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError || !profile ? (
        <Card><p className="text-sm text-text-muted">Couldn’t load your profile. Reload the page.</p></Card>
      ) : (
        <ProfileCard profile={profile} />
      )}
      {profile ? <NotificationsCard profile={profile} /> : null}
      <PasswordCard />
    </div>
  );
}
