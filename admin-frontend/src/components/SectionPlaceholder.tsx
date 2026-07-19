import { Card, EmptyState } from '@haizo/ui';

/**
 * Honest stand-in for a section whose CRUD lands in a later Phase-4 sub-step.
 * The route exists and the nav works so the shell is navigable end to end — the
 * page just says plainly what's coming rather than 404-ing.
 */
export function SectionPlaceholder({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 font-heading text-2xl font-bold text-text-strong">{title}</h1>
      <p className="mb-6 text-sm text-text-muted">Building in {phase}.</p>
      <Card>
        <EmptyState title={`${title} — coming in ${phase}`} description={description} />
      </Card>
    </div>
  );
}
