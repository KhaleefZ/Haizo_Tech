# Deployment topology

Confirmed with the client. These are load-bearing — the auth design depends on them.

| Host | Serves | Workspace | Local port |
|---|---|---|---|
| `haizotech.com` (+ `www`) | Public marketing site | `frontend` | 3000 |
| `admin.haizotech.com` | Internal dashboard (`/login` entry) | `admin-frontend` | 3001 |
| `api.haizotech.com` | Common API + Socket.IO | `backend` | 5001 |

## Why the subdomain layout matters

All three sit under the registrable domain **`haizotech.com`**. That is what makes
cookie authentication workable:

- Session cookies are set with `Domain=.haizotech.com`, so `admin.haizotech.com`
  can authenticate against `api.haizotech.com`.
- Because those hosts are *same-site* (even though they are cross-origin), the
  cookies can be `SameSite=Lax` — which means CSRF protection is retained.
  A cross-registrable-domain setup would force `SameSite=None` and give that up.
- The same cookies ride the Socket.IO handshake, so realtime auth needs no
  separate mechanism and no token in JavaScript.

**If the admin ever moves to a different registrable domain, this breaks.** The
fallback is a backend-for-frontend proxy so the browser only ever talks to one
origin. Don't move it casually.

## Cookies

| Cookie | Contents | Attributes | TTL |
|---|---|---|---|
| `hz_at` | access token | `HttpOnly; Secure; SameSite=Lax; Domain=.haizotech.com; Path=/` | 15 min |
| `hz_rt` | refresh token | `HttpOnly; Secure; SameSite=Strict; Domain=.haizotech.com; Path=/v1/auth` | 30 days |
| `hz_csrf` | double-submit value | `Secure; SameSite=Lax; Domain=.haizotech.com` (readable by JS on purpose) | session |

`hz_rt` is Path-scoped to `/v1/auth` so it is not transmitted on ordinary API
calls — it only travels when a refresh actually happens.

## Production environment

```bash
# backend
CORS_ORIGINS=https://haizotech.com,https://www.haizotech.com,https://admin.haizotech.com
COOKIE_DOMAIN=.haizotech.com
WEB_REVALIDATE_URL=https://haizotech.com/api/revalidate
REVALIDATE_SECRET=<same value as the frontend>

# frontend
NEXT_PUBLIC_API_URL=https://api.haizotech.com
NEXT_PUBLIC_SITE_URL=https://haizotech.com
REVALIDATE_SECRET=<same value as the backend>

# admin-frontend
NEXT_PUBLIC_API_URL=https://api.haizotech.com
NEXT_PUBLIC_SITE_URL=https://admin.haizotech.com
```

## The one deployment constraint that will bite

Next.js caches ISR output **per process, on local disk**. Run each Next app as a
**single instance** (`pm2 ... --instances 1`). With two instances, publishing
content revalidates one of them and the other keeps serving stale pages — and it
will look like the revalidation webhook is broken when it isn't.

The moment a second instance is genuinely needed, swap in a Redis-backed
`cacheHandler` in `next.config.ts`. Until then, one instance each.

## Checks before going live

- [ ] DNS: `haizotech.com`, `www`, `admin`, `api` all resolve to the VPS
- [ ] TLS on all four names (wildcard or SAN covering the apex + subdomains)
- [ ] `CORS_ORIGINS` holds the real https origins — no localhost in the production env
- [ ] `COOKIE_DOMAIN=.haizotech.com`, and cookies verified over real HTTPS, **not localhost**
- [ ] `REVALIDATE_SECRET` identical on backend and frontend
- [ ] Each Next app running at exactly one instance
- [ ] Publish a blog post and confirm it appears on the public site within 2s
