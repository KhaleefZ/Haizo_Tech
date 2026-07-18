# HaizoTech

Public marketing site, admin dashboard and common backend, in one monorepo.

This replaces the three-app system currently at
[github.com/KhaleefZ/Haizo_tech-website](https://github.com/KhaleefZ/Haizo_tech-website).
That repository stays running until cutover and is the source we port logic from —
it is not edited by this project.

## Layout

```
apps/web        Public marketing site      (Next 15, :3000)
apps/admin      Internal ops dashboard     (Next 15, :3001)
packages/config Design tokens, tsconfig, eslint  ← single source of truth for the theme
packages/ui     Shared component library   (used by BOTH apps)
packages/types  Generated from the OpenAPI spec  ← never hand-edited
packages/realtime  Socket event names + payloads, shared by server and apps
server          Express + Prisma + Socket.IO API (:5001)
design          Phase 0 static HTML prototype (no build step)
e2e             Playwright, drives both apps
```

## Getting started

```bash
pnpm install
cp server/.env.example server/.env      # then fill it in
pnpm --filter @haizo/server prisma:generate
pnpm dev
```

`pnpm verify` runs the full gate — the same one CI runs:

```
spec:lint → gen:check → typecheck → lint → build → test
```

## The decisions worth knowing

**The tokens live in exactly one file.** `packages/config/theme.css` is the Tailwind v4
`@theme` block, ported verbatim from the Phase 0 prototype that was approved. No app and
no component may write a hex value. This is what keeps the public site and the admin
looking like one product, and what makes a future dark theme one block rather than a
rewrite.

**The OpenAPI spec is hand-authored and canonical.** `server/openapi/openapi.yaml` is the
source of truth; `packages/types` is generated from it and committed. Code-first
generation was rejected on purpose — a spec derived from the implementation can never
catch "the implementation is wrong", which is precisely the bug class the previous
backend had. CI fails three ways if they diverge: the spec must lint, regenerating must
produce no diff, and response validation runs in dev and test.

**The database schema only ever grows.** `server/prisma/schema.prisma` is the live
production schema, extended additively. No renames, no drops, until 30 days after
cutover. That constraint is the entire rollback plan: because the old code still runs
against the new schema, cutover is an nginx change and rollback is the same change
backwards.

`REDESIGN.md` proposes `Lead` / `CaseStudy` / `BlogPost` and `ADMIN` / `EDITOR` roles.
Those are a naming sketch, not a target — the live database uses `Inquiry` / `Work` /
`Blog` and `SUPER_ADMIN` / `MANAGER` / `DEV`, and that wins.

**Auth is HttpOnly cookies, not localStorage.** The previous admin kept its JWT in
`localStorage`, where any XSS could read it, and the socket layer read it from there
too. Cookies are sent on the WebSocket handshake, so both paths are covered by one
mechanism. Requires all three apps on one registrable domain — verify the DNS plan
before Phase 3.

**Layering is enforced, not suggested.** `routes → controllers → services →
repositories`. Controllers do HTTP and nothing else; repositories are the only code that
touches Prisma. The previous backend put everything in controllers, which is why nothing
was testable.

## Status

| Phase | | |
|---|---|---|
| 0 | Design prototype | ✅ approved — see [`design/`](design/README.md) |
| 1 | Monorepo, tokens, component library, contract spine | 🔨 in progress |
| 2 | Public site + instant content revalidation | — |
| 3 | Backend hardening, cookie auth, full contract | — |
| 4 | Admin rebuild (full ops suite, light theme) | — |
| 5 | Notifications, activity feed, Cmd-K, digests | — |
| 6 | Attachments to S3/R2, analytics | — |
| 7 | Internal team chat | — |
| 8 | Public visitor chat widget | — |
| 9 | QA, CI/CD, cutover | — |

Full plan, including the cutover runbook and risk register:
`~/.claude/plans/analsye-all-the-files-toasty-naur.md`

> **Note on `design/`:** several pages carry amber `.unverified` markers on figures,
> timelines, pricing and narrative that were written for the mockup and never confirmed.
> Those must be checked before any of that copy reaches production — see
> [design/README.md](design/README.md).
