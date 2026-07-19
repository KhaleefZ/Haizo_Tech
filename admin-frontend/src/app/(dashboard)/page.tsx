'use client';

import { Card } from '@haizo/ui';
import { useAuth } from '../../lib/auth';

const STATS = [
  { label: 'New inquiries', hint: 'awaiting triage' },
  { label: 'Open projects', hint: 'in progress' },
  { label: 'Published services', hint: 'live on the site' },
  { label: 'Draft blog posts', hint: 'unpublished' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name.split(/\s+/)[0] ?? 'there';

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-heading text-2xl font-bold text-text-strong">Welcome back, {firstName}</h1>
      <p className="mt-1 text-sm text-text-muted">
        Here&rsquo;s the shape of the dashboard. Live figures wire up in Phase 4d.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label}>
            <p className="text-sm font-medium text-text-muted">{s.label}</p>
            {/* An em-dash, not a fake number — the widgets are honestly not wired yet. */}
            <p className="mt-2 font-heading text-3xl font-bold text-text-strong">—</p>
            <p className="mt-1 text-xs text-text-muted">{s.hint}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <p className="text-sm font-semibold text-text-strong">Recent activity</p>
        <p className="mt-2 text-sm text-text-muted">
          The activity feed and recent inquiries arrive with the ops suite (Phase 4c–4d).
        </p>
      </Card>
    </div>
  );
}
