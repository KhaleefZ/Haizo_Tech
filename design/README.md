# Phase 0 — Design prototype

Static HTML mockups of the HaizoTech rebuild. **No framework, no build step.** They exist so the
look can be approved before any application code is written.

## Viewing

```bash
cd "Haizotech WEbsite/design"
python3 -m http.server 4173
```

Then open <http://127.0.0.1:4173/index.html> in Brave.

Open them over HTTP rather than double-clicking the files — `file://` breaks relative navigation
between pages in some browsers.

## What's here

**Public site**

| File | Page |
|---|---|
| `index.html` | Home — the reference page. Hero animation, industries, services, engineering culture, process, case studies, testimonials, CTA band, footer. |
| `services.html` | Services index — the highest-converting page |
| `service-detail.html` | One service in depth |
| `work.html` | Case-study index with working industry filters |
| `work-detail.html` | Sri ASK Residency / RBMS case study |
| `blog.html` | Article index |
| `contact.html` | Contact form with honeypot + consent |

**Admin** — the light-theme conversion is the biggest unknown in this project, so it is mocked at
the same fidelity as the public site.

| File | Screen |
|---|---|
| `admin-dashboard.html` | Stats, recent inquiries, notification feed, velocity, system health |
| `admin-table.html` | Content CRUD with tabs — **Testimonials is the new one** |
| `admin-kanban.html` | Board at density — the hardest screen to make read on white |
| `admin-chat.html` | Team chat: presence, typing, read receipts, mentions, attachments |

**Shared**

| File | Purpose |
|---|---|
| `tokens.css` | The design tokens. **This becomes `packages/config` verbatim in Phase 1.** |
| `styles.css` | Public component layer — every rule maps to a future `packages/ui` component |
| `admin.css` | Admin app-shell layer. Same palette, higher density — not a second theme. |
| `app.js` | The minimum behaviour needed to judge the design (scroll reveal, sticky header, filters, tabs) |

## Decisions worth reviewing

These are the choices most worth agreeing or overruling before Phase 1 starts.

1. **White-dominant, blue as accent.** Blue covers roughly 10–15% of any surface. Gradients appear
   only on the hero wash and the CTA band — never as page decoration. No glassmorphism, no glowing
   orbs.
2. **Admin uses the same palette, not a second theme.** Navy for structure (sidebar), tinted app
   background, pure-white content cards. On the kanban, priority rides a 3px left edge rather than
   tinting the whole card — that's what keeps a 40-card board calm on white.
3. **The fabricated testimonials are gone.** `index.html` shows the one verifiable quote plus a
   deliberate empty state. In `admin-table.html`, publishing is gated on `sourceUrl` +
   `verifiedAt`, so an unverifiable quote cannot be published even deliberately.
4. **Honest gaps over padding.** `work.html` shows an explicit "no published case study yet" card
   for FinTech instead of inventing a client.
5. **Hero is unclipped.** The live site truncates its H1; `styles.css` guards against it explicitly.
6. **Labels unified.** It is "Work" everywhere — the live site's nav says "Our Works" while the
   footer says "Portfolio".

## ⚠️ Unverified copy — must be fixed before anything ships

Four pages contain figures and narrative that were **written for the mockup and never confirmed**.
They are highlighted in amber (`.unverified`) with a hover tooltip, and each page carries a warning
banner. This matters more than usual here: shipping unverified claims is the exact failure this
redesign exists to correct.

| Page | Claim | Needs |
|---|---|---|
| `work-detail.html` | "0 double bookings since launch" | Confirm with Sri ASK Residency |
| `work-detail.html` | "99.9% uptime" | Real monitoring figure |
| `work-detail.html` | "7 wks scope to production" | Real project duration |
| `work-detail.html` | The narrative — paper register, one-week on-site discovery, "availability is derived, never stored" | Reads as authoritative fact; verify each detail |
| `service-detail.html` | "₹5L–₹15L" typical build cost | **Commercial claim** — your real pricing |
| `service-detail.html`, `services.html` | "6–12 weeks", "1–3 weeks" timelines | Your real numbers |
| `contact.html` | `hello@haizotech.com` | Guessed — use the real inbox |
| `contact.html` | "Within one working day" | An SLA you're committing to publicly |

Only "front-desk time down ~40%" was supplied rather than invented — it is not highlighted.

To find every remaining item: `grep -rn 'unverified' *.html`

## Verified

- No horizontal overflow at 375px on any page (checked via `scrollWidth`).
- Kanban board scrolls inside its own container; the page does not.
- Sora + Inter loading correctly.
- Every animation sits behind `prefers-reduced-motion: reduce`.
- Visible focus rings, skip-to-content link, labelled form controls, semantic landmarks.

## Not built here on purpose

Dark mode (tokens allow it later; `tokens.css` has an inert `[data-theme="dark"]` block proving
components are token-driven), the public visitor chat widget (Phase 8), real content, and any
backend behaviour. Buttons don't submit anything.
