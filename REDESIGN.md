# HaizoTech — Full-Stack Redesign Blueprint

**Public marketing site · Admin dashboard · Common backend**
Direction: **light, white + blue, professional service-based agency**
Stack (existing): Next.js 14 App Router · Tailwind v4 · Framer Motion · GSAP · Lenis · Express + Prisma · Hostinger KVM 2 VPS

> This document is the single source of truth for the redesign. It is written so a
> developer can scaffold from it on Monday and a founder can pitch from it in the
> same read. Sections follow the HaizoTech planner order, then hand off to the
> backend and QA tracks.

---

## 0. Executive summary — the bottom line

Today haizotech.com reads as a **dark web3/AI template**: clipped hero headline,
gradient orbs, boilerplate "consensus / high-frequency" copy, and fabricated
testimonials. For a service agency selling to healthcare, fintech and SMB clients,
that palette and copy actively *lower* trust.

The redesign flips the site to a **white-dominant, blue-accented, credibility-first**
agency site: real proof (case studies, team, metrics), plain-English engineering
copy, a restrained but polished hero animation, and a consistent design-token system
shared across the **public site** and the **admin dashboard**, both talking to one
**contract-validated backend**.

Three tracks, run in order:

1. **Frontend redesign** — new brand system + rebuilt pages (public + admin shell).
2. **Backend audit & hardening** — fix drift, consolidate schemas, lock the OpenAPI contract, enforce roles.
3. **QA & deploy readiness** — test the pyramid against the contract, catch localhost-vs-live landmines, gate CI, ship.

**Do first (this week):** fix the clipped hero text and remove the fake
testimonials — those are live credibility leaks. Everything else follows.

---

## 1. Product idea (the site as a product)

**One-liner:** A conversion-focused agency website that makes a lean Coimbatore
product studio look as trustworthy and capable as a mid-size firm — by leading with
proof, not decoration — and an internal admin that lets the team run content, leads,
and portfolio without touching code.

- **Problem:** the current site signals "trend-follower," has no proof, and leaks credibility (broken hero, fake reviews).
- **Target user:** (a) prospective clients evaluating a build partner; (b) HaizoTech team members managing the site.
- **The wedge:** *real work, plainly shown.* Case studies + team + honest metrics beat gradient orbs every time in this buyer's decision.

---

## 2. Product summary & scope

**What it is:** a marketing site (public) + admin dashboard (internal) on a shared
backend and shared design system.

**Core value:** turn visitors into qualified project enquiries; give the team a
no-code way to keep the site current.

**In scope for v1**
- Public: Home, Services, Service detail, Work/Case studies, Work detail, Industries, About/Team, Blog, Blog post, Contact, Privacy, Terms.
- Admin: auth, dashboard, leads inbox, blog CRUD, case-study CRUD, testimonials CRUD, service CRUD.
- New white/blue design system, hero animation, full responsive + a11y pass.

**Explicitly out of scope for v1**
- Client login portal / project tracking, payments, multi-language, dark-mode toggle (design tokens will *allow* it later, but it is not built now), CMS migration to a third-party headless platform.

---

## 3. Positioning & branding — idea-generator track

Two tracks, evaluated separately per the idea-generator method. These are
*positioning bets* for HaizoTech's own site, not net-new products. Validate the two
starred picks with 2–3 real prospect conversations before over-investing.

### India track (primary market — Coimbatore/Tamil Nadu SMB + regional)

| # | Positioning bet | Why it fits / "why now" | Score /5 |
|---|---|---|---|
| 1 ★ | **"Your local product studio that ships like a big firm"** — proximity + real SaaS case studies (Sri ASK Residency RBMS, venue/school SaaS) | India SMBs distrust faceless agencies; a local team with shipped products is a rare, checkable edge. Digital-India + UPI/ONDC wave = SMBs buying software now. | 4.6 |
| 2 | **Vertical SaaS positioning** — lead with the venue/mandapam + hotel + school builds as productized offers, not custom quotes | You already have these assets; productizing lifts margin and repeatability | 4.2 |
| 3 | **"AI-integrated builds, honestly explained"** — plain-English AI (not buzzwords) as a differentiator vs template agencies | Buyers are AI-curious but burned by hype; clarity converts | 3.8 |

### Global track (remote, USD/EUR)

| # | Positioning bet | Why it fits / "why now" | Score /5 |
|---|---|---|---|
| 1 ★ | **"Senior-quality full-stack delivery at India rates, with a real portfolio"** — niche on shipped SaaS MVPs for early-stage founders | Global founders want a reliable remote build partner with proof; sharp niche beats me-too "we do everything" | 4.3 |
| 2 | **Productized "MVP in N weeks" offer** — fixed-scope, fixed-price landing → the site sells one crisp thing | Founders buy outcomes and certainty; a clear wedge outperforms a services menu | 4.1 |
| 3 | **Design-forward engineering** — position on polish + engineering (your redesign itself becomes proof) | Global bar for polish is high; the new site is the demo | 3.6 |

**Overall bet:** lead the **India ★** message site-wide, and add a **global "MVP in
N weeks" ★** productized offer as a distinct CTA path. Both are backed by assets you
already have — reuse them.

> *Note on evidence:* these are positioning hypotheses grounded in HaizoTech's known
> assets and market context, not fresh cited web research. Treat the scores as
> informed bets; confirm willingness-to-pay with real prospects before scaling spend.

---

## 4. Branding & labelling system

- **Name/wordmark:** keep **HaizoTech**. Keep the existing globe mark; recolor only.
- **Logo colorways (ship all three as SVG):**
  - Primary: navy wordmark `#0F2A57` + blue mark `#1D4ED8` on white.
  - Reversed: white wordmark + white/blue mark on navy (footer, dark buttons).
  - Mono: single-color navy and single-color white for constrained placements.
- **Tagline (pick one, use consistently):** *"Custom software, plainly delivered."* / *"We build and ship real products."*
- **Voice:** clear, senior, no hype. Say what you did and what it produced. Never "proprietary consensus / high-frequency" filler.
- **Labelling consistency:** one term per concept everywhere — "Work" (not Work/Portfolio/Our Works mixed), "Services", "Industries", "About", "Contact". Fix the current nav↔footer mismatch (nav says "Our Works", footer says "Portfolio").

---

## 5. Color palette (white + blue) — design tokens

Accessible, white-dominant. Blue is the accent (~10–15% of surface), navy gives depth.
All pairings below meet WCAG AA for their intended text size.

```css
/* globals.css — @theme (Tailwind v4) */
@theme {
  /* Brand */
  --color-brand-blue:   #1D4ED8;  /* primary: buttons, links, key accents */
  --color-brand-blue-600:#1E40AF; /* hover/pressed */
  --color-brand-sky:    #3B82F6;  /* bright accent, icons, highlights */
  --color-brand-navy:   #0F2A57;  /* headings, footer bg, dark surfaces */

  /* Surfaces */
  --color-bg:           #FFFFFF;  /* main background */
  --color-bg-tint:      #F5F8FF;  /* alternating section band */
  --color-bg-tint-2:    #EFF4FF;  /* deeper tint / hover fills */
  --color-card:         #FFFFFF;

  /* Lines & text */
  --color-border:       #E2E8F0;  /* card borders, dividers */
  --color-text:         #334155;  /* body (slate-700) */
  --color-text-strong:  #0F172A;  /* H1–H3 */
  --color-text-muted:   #64748B;  /* captions, meta */

  /* Feedback */
  --color-success:      #16A34A;
  --color-warning:      #D97706;
  --color-danger:       #DC2626;

  /* Effects */
  --shadow-card:  0 4px 20px rgba(15,42,87,.06);
  --shadow-lift:  0 12px 32px rgba(15,42,87,.10);
  --radius:       14px;
  --hero-gradient: linear-gradient(120deg,#1D4ED8 0%,#3B82F6 100%);
}
```

**Usage rules**
- White is the default background; use `--color-bg-tint` to alternate section bands for rhythm.
- Gradients only on the hero and on the occasional CTA band — never as page-wide decoration.
- Blue for interactive/emphasis; navy for structural depth (footer, headings). No glassmorphism, no glowing orbs.
- Contrast: body `#334155` on white = AA; headings `#0F172A`; never light-gray-on-light for anything readable.

**Dark-mode readiness (not built in v1):** because everything is a token, a later
dark theme = one alternate `@theme` block. Keep components token-driven so this stays cheap.

---

## 6. Typography

- **Headings:** `Sora` (or `Space Grotesk` / `Plus Jakarta Sans`) — geometric, confident.
- **Body:** `Inter` — neutral, highly readable.
- **Load:** `next/font` (self-hosted, `display: swap`) — no layout shift, good CWV.

```
Type scale (fluid via clamp)
Display / H1  clamp(2.5rem, 5vw, 4rem)   weight 700  line-height 1.05  tracking -0.02em
H2            clamp(2rem, 3.5vw, 2.5rem) weight 700  line-height 1.15
H3            1.5rem                      weight 600  line-height 1.25
H4            1.25rem                     weight 600
Body-lg       1.125rem                    weight 400  line-height 1.6
Body          1rem                        weight 400  line-height 1.6
Small/meta    0.875rem                    weight 500  color: text-muted
Overline      0.75rem  uppercase  tracking 0.08em  weight 600  color: brand-blue
```

Rule: strong weight contrast between headings (600–700) and body (400) is what reads
as "intentionally designed" instead of templated.

---

## 7. Page-by-page redesign (public site)

Every page: white base, alternating tint bands, card style
(`bg-card` + `1px border` + `--shadow-card`, hover → `--shadow-lift` + blue border),
fade-up on scroll (Framer Motion, respects `prefers-reduced-motion`), Lenis smooth scroll.

### Home
1. **Header** — sticky, white, subtle shadow on scroll. Logo left; nav (Services, Work, Industries, About, Blog); one solid-blue **Start a Project** button.
2. **Hero** — see §8 for the animation spec. Navy headline + one blue keyword, short subhead, primary (solid blue) + secondary (outline) CTA, right-side abstract blue illustration/product shot. **Fix the clipped headline.**
3. **Trusted-by / industries strip** — single clean grid (remove the duplicated loop), each with a real one-line capability.
4. **Services** — 3–6 real cards, blue icon in tinted rounded square, one-line value each, link to detail.
5. **Engineering culture** — rewrite crypto copy into plain English: scalable architecture, clean code, CI/CD, security-by-default. Keep the security list (RBAC, encryption, GDPR/HIPAA, CI/CD) — it's persuasive.
6. **Process** — keep the 4 steps; restyle blue/white with a connecting line.
7. **Case studies teaser** — 2–3 real projects (start with Sri ASK Residency / RBMS). Problem → build → result.
8. **Testimonials** — **real only.** Remove fabricated "Sarah Chen / Michael Chang." Two honest quotes beat five fake.
9. **CTA band** — navy or blue-gradient band, white text, "Ready to build something real?" + one button.
10. **Footer** — navy, white logo, consistent labels, contact + Coimbatore address + socials.

### Services (index) & Service detail
- Index: each service its own block — what it is, what you deliver, tech stack, typical timeline. **This is the money page.**
- Detail: hero, deliverables, stack, process, related work, FAQ, CTA.

### Work (index) & Case-study detail
- Index: filterable grid (industry/type). Real projects only.
- Detail: outcome/metric up top, problem, approach, stack, screenshots, quote, next-project CTA. (Reuse the existing `/work` server-component + `WorkGrid.tsx` client split already in progress.)

### Industries
- One clean grid; each industry → one line of *real* capability (drop vague filler). Optional link to relevant work.

### About / Team  *(new — humans close service deals)*
- Story, Coimbatore roots, founders (you + Khaleef), values, small stats. Photos.

### Blog & Blog post
- Card list → article layout (readable measure, TOC optional). Fed by admin CRUD.

### Contact
- White, clean form: name, email, project type, budget range, message → blue submit. Email + location beside it. Currently the weakest conversion point — make it effortless. Spam protection (honeypot + rate limit) server-side.

### Privacy / Terms
- Simple readable legal template pages, linked in footer.

---

## 8. Hero section — copy + animation spec

**Copy (fixes the clipped headline, adds real context):**
> **Overline:** COIMBATORE-BASED PRODUCT STUDIO
> **H1:** Custom software, **plainly delivered.**
> **Subhead:** We design, build and ship web, mobile and AI products for startups and businesses — with the senior engineering and honest delivery a lean, in-house team gives you.
> **Primary CTA:** Start a Project → **Secondary CTA:** See our work

**Animation & effects (restrained, professional — not a light show):**
- **Headline:** staggered word fade-up (Framer Motion `staggerChildren` ~0.06s), the blue keyword animates last. ~600ms total.
- **Subhead + CTAs:** fade-up after headline (small delay).
- **Background:** very subtle blue mesh/gradient wash on white + a slow-drifting soft blob (low opacity, `#3B82F6`), GPU-friendly. No dark orbs.
- **Right visual:** floating product/dashboard card with a gentle parallax on scroll (Lenis) and a soft shadow; optional animated line-draw of an abstract architecture graphic (GSAP `DrawSVG`-style, or stroke-dashoffset).
- **Micro:** primary button has a subtle sheen/hover lift; a small down-chevron nudges on load.
- **Accessibility:** every motion wrapped in `prefers-reduced-motion: reduce` → render final state instantly. No motion that blocks reading.
- **Performance budget:** hero must not regress LCP — animate transform/opacity only, lazy-load the heavy visual, keep JS for the hero minimal.

---

## 9. Admin dashboard redesign

Same token system, "app" density (tighter spacing, `bg-tint` app shell, white content cards).

- **Shell:** left nav (Dashboard, Leads, Work/Case studies, Services, Blog, Testimonials, Settings), top bar (user, logout).
- **Auth:** login page, protected routes, session/JWT (see backend §12).
- **Screens:** dashboard (lead count, recent enquiries, quick stats), Leads inbox (list + detail + status), CRUD tables for Blog / Case studies / Services / Testimonials with forms + validation + optimistic UI.
- **States everywhere:** loading, empty, error, disabled, role-gated — QA will assert these.
- **Shared UI package:** buttons, inputs, cards, badges, table, modal, toast — one component library imported by *both* public and admin so nothing is styled twice.

---

## 10. Component & code structure

```
apps/
  web/                    # public marketing site (Next.js 14 App Router)
    app/
      (marketing)/
        page.tsx                  # Home
        services/                 # index + [slug]
        work/                     # index (server) + WorkGrid.tsx (client) + [slug]
        industries/page.tsx
        about/page.tsx
        blog/                     # index + [slug]
        contact/page.tsx
        privacy/page.tsx  terms/page.tsx
      layout.tsx  globals.css
    components/
      hero/  sections/  cards/  forms/
  admin/                  # admin dashboard (Next.js)
    app/(dashboard)/ ...  app/login/
    components/
packages/
  ui/                     # SHARED design system — buttons, inputs, card, table, modal, toast, badge
  config/                 # tailwind preset (@theme tokens), tsconfig, eslint
  types/                  # shared TS types generated from OpenAPI (single source)
server/                   # Express + Prisma (common backend)
  src/
    routes/  controllers/  services/  repositories/  schemas/  middleware/  lib/
    prisma/  (schema.prisma, migrations/)
    openapi/ (openapi.yaml)
```

**Conventions:** one component library in `packages/ui` consumed by both apps; design
tokens live once in `packages/config`; shared types generated from the OpenAPI spec into
`packages/types` (never hand-duplicated). One naming convention per concept.

---

## 11. Backend audit — full findings & fixes to correct

Applying the backend-developer standards to the existing Express + Prisma backend.
This is the **"what we need to correct" list.** Group by severity.

### 🔴 Blockers (fix before redesign ships)
- [ ] **OpenAPI ↔ code drift** — audit every route against `openapi.yaml`; no phantom or missing endpoints. Every route in spec, every spec path implemented.
- [ ] **Duplicated schemas/DTOs** — find models/validators declared in two places; define each **once** and `$ref`/import it. Consolidate inline schema bodies into `components/schemas`.
- [ ] **Auth/authorization on every protected route** — admin + write endpoints must enforce role checks (planner role matrix). No endpoint that skips the permission gate.
- [ ] **Input validation at every boundary** — Zod (or existing validator) on all request payloads; reject bad input with a consistent 400/422 shape.
- [ ] **Secrets in env, not code** — verify DB URL, JWT secret, third-party keys all come from env; nothing hardcoded.
- [ ] **Parameterized queries only** — confirm Prisma usage everywhere; no string-built SQL.

### 🟠 High (fix during redesign)
- [ ] **One standard error response format** across the whole API (`{ error: { code, message, details? } }`).
- [ ] **Clean layering** — move any business logic/raw queries out of controllers into services/repositories. Controllers = HTTP in/out only.
- [ ] **Migrations, not hand-edits** — every schema change is a Prisma migration; confirm they run up *and* down cleanly.
- [ ] **Connection pooling + config** — pooled DB connection, env-based, SSL for prod DB.
- [ ] **Pagination/filtering** on list endpoints (leads, blog, work).
- [ ] **CORS** — lock allowed origins to the real public + admin domains per environment (not `*`).
- [ ] **Rate limiting + honeypot** on the public contact endpoint (spam/abuse).

### 🟡 Medium (hardening)
- [ ] Consistent naming (`userId` vs `user_id`) — one convention.
- [ ] Indexes on lookup/join/foreign-key columns.
- [ ] Centralized logging + request IDs.
- [ ] Re-validate the spec with a linter (`swagger-cli validate` / Spectral) until green.

### Endpoints the redesign needs (representative)
```
Public
  POST /api/leads                 # contact form → create lead (rate-limited, validated)
  GET  /api/services              # list services            GET /api/services/:slug
  GET  /api/work                  # list case studies        GET /api/work/:slug
  GET  /api/industries
  GET  /api/blog                  # list (paginated)         GET /api/blog/:slug
  GET  /api/testimonials

Admin (auth + role required)
  POST /api/auth/login   POST /api/auth/logout   GET /api/auth/me
  GET  /api/admin/leads   PATCH /api/admin/leads/:id      # status
  CRUD /api/admin/blog    CRUD /api/admin/work
  CRUD /api/admin/services  CRUD /api/admin/testimonials
```
All error responses share one schema; all list responses share a paginated envelope;
both defined once under `components/` and `$ref`ed.

### Data model (core entities)
`Lead(id, name, email, projectType, budget, message, status, createdAt)` ·
`Service(id, slug, title, summary, body, stack[], order)` ·
`CaseStudy(id, slug, title, industry, problem, approach, result, metrics, images[], testimonialId?)` ·
`Testimonial(id, author, role, company, quote, avatar, published)` ·
`BlogPost(id, slug, title, excerpt, body, coverImage, tags[], published, publishedAt)` ·
`Industry(id, slug, name, capability)` ·
`User(id, email, passwordHash, role)` — roles: `ADMIN`, `EDITOR`.

---

## 12. Roles, auth & accessibility

- **Roles → permissions**
  | Action | Visitor | EDITOR | ADMIN |
  |---|---|---|---|
  | View public pages | ✅ | ✅ | ✅ |
  | Submit contact form | ✅ | ✅ | ✅ |
  | View leads | — | ✅ | ✅ |
  | CRUD blog/work/services/testimonials | — | ✅ | ✅ |
  | Manage users / settings | — | — | ✅ |
- **Auth:** email + password (hashed, bcrypt/argon2), JWT or session cookie (`HttpOnly`, `Secure`, `SameSite`), protected admin routes middleware.
- **Accessibility (a11y) target: WCAG 2.1 AA** — semantic landmarks, keyboard nav, visible focus rings (blue), alt text, form labels + error announcements, AA contrast (tokens already satisfy), `prefers-reduced-motion` honored in all animations, skip-to-content link.
- **Data protection:** India DPDP + GDPR basics — consent on the contact form, privacy policy, don't log PII in plaintext, retention note for leads.

---

## 13. QA & test plan — what to verify (senior-qa track)

Test both ends **against the same OpenAPI contract.** Verdict at the end must be an
explicit **go / no-go.**

### Test pyramid
- **Unit (Vitest):** utils, lead/blog/service business logic, form validation, slug helpers.
- **Component (React Testing Library + axe):** hero, cards, forms, admin tables — cover **loading / empty / error / disabled / role-gated** states; assert a11y (no axe violations).
- **Integration:** service → repository → test DB; API route → DB round-trips.
- **API/contract:** hit every endpoint — status codes, auth (401/403), validation (400/422), error shape; **validate responses against `openapi.yaml`** so the API can't drift.
- **E2E (Playwright):** core flows across desktop + mobile viewports:
  1. Visitor → Home → Services → Contact → submit → success + lead created.
  2. Visitor → Work → case-study detail.
  3. Admin → login → view lead → change status.
  4. Admin → create blog post → appears on public blog.

### Localhost-vs-live landmines to check (most prod bugs live here)
- [ ] Frontend `NEXT_PUBLIC_API_URL` points at the real backend per env — **no `localhost` baked into the production bundle.**
- [ ] CORS allow-list matches the deployed public + admin domains.
- [ ] Cookies `Secure` + `SameSite` correct under HTTPS; auth works cross-subdomain if apps are on different hosts.
- [ ] All env vars present on the VPS (JWT secret, DB URL, mail/API keys) — none missing/renamed; no test keys in prod.
- [ ] Prisma migrations apply cleanly on the production DB; SSL + connection limits OK.
- [ ] **Test the production build** (`next build` + prod server), not just `next dev`.

### Deployment readiness gate (before ship)
- [ ] `install → typecheck → lint → build → test` all green in CI.
- [ ] Prod build of web + admin + server succeeds.
- [ ] Migrations apply on production-like DB; seed/reference data present.
- [ ] Smoke test on staging: health check, contact submit, admin login, one CRUD.
- [ ] Rollback path known (previous release/tag) if smoke fails.

---

## 14. Build roadmap (phased, riskiest-first)

- **Phase 0 — Credibility hotfixes (Day 1):** fix clipped hero headline; remove fake testimonials; fix nav↔footer label mismatch. Ship immediately on the current site.
- **Phase 1 — Design system:** tokens (`@theme`), typography, `packages/ui` component library, recolored logo SVGs. This unblocks everything.
- **Phase 2 — Public rebuild:** Home (with hero animation §8) → Services + detail → Work + detail → Industries → About/Team → Contact → Blog → legal. Backend endpoints wired as each page needs them.
- **Phase 3 — Backend audit & hardening:** work the §11 correction list; lock OpenAPI; enforce roles; consolidate schemas.
- **Phase 4 — Admin rebuild:** auth, leads inbox, CRUD screens on the shared UI.
- **Phase 5 — QA & deploy:** full pyramid + contract tests + Playwright flows; env/deploy gate; CI; staging smoke; go/no-go; ship.

---

## 15. Risks & next steps

**Risks & mitigations**
- *Fake testimonials already public* → remove today; replace with real quotes (highest-priority credibility fix).
- *OpenAPI drift silently breaks the redesign's data* → make the contract audit a Phase-3 blocker; generate shared types from the spec so drift fails the build.
- *Hero animation hurts Core Web Vitals* → transform/opacity only, lazy-load heavy visual, measure LCP, `prefers-reduced-motion`.
- *Two apps + shared packages = env sprawl on one VPS* → document every env var per app/environment; QA gate checks for missing/hardcoded values.
- *Scope creep (client portal, payments, i18n)* → explicitly out of v1 (§2); tokens/architecture leave the door open without building it now.

**Immediate next actions**
1. Approve **white + blue** tokens and typography in §5–6.
2. Ship Phase-0 hotfixes to the live site.
3. Scaffold `packages/ui` + `packages/config` tokens; produce recolored logo SVGs.
4. Build the new Home + hero as the reference page, then roll the system across remaining pages.
5. Kick the backend §11 correction list in parallel and lock the OpenAPI contract.

---

*Prepared as HaizoTech's redesign blueprint — planner → backend → QA. Every section is
consistent with the others; the roadmap tests the biggest credibility and contract
risks first. Positioning scores are informed bets to validate with real prospects, not
cited market figures.*
