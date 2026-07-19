import { Badge, Card } from '@haizo/ui';

/** Phase 1 smoke page. The real admin shell lands in Phase 4. */
export default function AdminHome() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-h2">Admin foundation</h1>
      <p className="mt-3 text-text">
        Sharing one token set with the public site, at admin density.
      </p>
      <Card className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success" dot>
            Shell ready
          </Badge>
          <Badge variant="neutral">Phase 4 builds the ops suite</Badge>
        </div>
      </Card>
    </main>
  );
}
