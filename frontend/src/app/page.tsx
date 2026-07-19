import { Badge, Button, Card } from '@haizo/ui';

/**
 * Phase 1 smoke page. Its only job is to prove the token pipeline works end to
 * end: theme.css -> Tailwind v4 -> @haizo/ui -> rendered app. The real home page
 * (approved in design/index.html) lands in Phase 2.
 */
export default function Home() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-24">
      <p className="text-overline uppercase text-brand-blue">Phase 1 · foundation</p>
      <h1 className="mt-4 text-display">
        We build <span className="text-brand-blue">custom software.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-body-lg text-text">
        Design tokens, shared component library and the API contract are wired. The
        approved marketing pages are built on this in Phase 2.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="primary">Start a Project</Button>
        <Button variant="outline">What we do</Button>
      </div>

      <Card className="mt-12">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success" dot>
            Tokens loaded
          </Badge>
          <Badge variant="brand">@haizo/ui</Badge>
          <Badge variant="neutral">contract-typed</Badge>
        </div>
        <p className="mt-4 text-sm text-text-muted">
          Every colour on this page comes from packages/config/theme.css. No hex value is
          written in an app or a component.
        </p>
      </Card>
    </main>
  );
}
