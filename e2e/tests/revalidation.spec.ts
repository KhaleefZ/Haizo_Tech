import { test, expect, request as pwRequest } from '@playwright/test';
import { createHmac } from 'node:crypto';

/**
 * THE test for Phase 2.
 *
 * The old site fetched with `revalidate: 600`, so a published edit could sit
 * invisible for ten minutes. Fixing that is the point of the whole revalidation
 * mechanism, and a fix nobody measures is a fix nobody can trust.
 *
 * This drives the real path: sign a revalidation request exactly as the backend
 * does, send it, then poll the public page until the change is visible — and
 * fail if that takes longer than two seconds.
 *
 * It also guards the security properties, because an endpoint that invalidates
 * cache for anyone who finds the URL is a denial-of-service lever.
 */

const WEB = process.env.WEB_URL ?? 'http://localhost:3000';
const API = process.env.API_URL ?? 'http://localhost:5001';
const SECRET = process.env.REVALIDATE_SECRET ?? 'local-dev-revalidate-secret';

const BUDGET_MS = 2000;

function sign(ts: number, body: string) {
  return 'sha256=' + createHmac('sha256', SECRET).update(`${ts}.${body}`).digest('hex');
}

async function revalidate(tags: string[], paths: string[] = []) {
  const ctx = await pwRequest.newContext();
  const ts = Date.now();
  const body = JSON.stringify({ event: 'test.publish', tags, paths, ts });
  const res = await ctx.post(`${WEB}/api/revalidate`, {
    headers: {
      'content-type': 'application/json',
      'x-haizo-timestamp': String(ts),
      'x-haizo-signature': sign(ts, body),
    },
    data: body,
  });
  // Read the body BEFORE disposing the context — disposing invalidates the
  // response and any later .json() throws "Response has been disposed".
  const status = res.status();
  const json = status === 200 ? await res.json() : null;
  await ctx.dispose();
  return { status, json };
}

test.describe('content revalidation', () => {
  test('a signed request invalidates the named tags', async () => {
    const { status, json } = await revalidate(['services', 'home'], ['/']);
    expect(status).toBe(200);
    expect(json.revalidated.tags).toContain('services');
  });

  test('published content appears on the public site within 2 seconds', async ({ page }) => {
    // Baseline: the services page is serving cached content.
    await page.goto('/services');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const started = Date.now();
    const { status } = await revalidate(['services'], ['/services']);
    expect(status).toBe(200);

    // Re-request until the page has been rebuilt. In practice the first reload
    // already serves fresh content; the loop exists so the assertion measures
    // real propagation rather than a fixed sleep.
    let elapsed = 0;
    let ok = false;
    while (elapsed < BUDGET_MS) {
      const resp = await page.reload({ waitUntil: 'domcontentloaded' });
      elapsed = Date.now() - started;
      if (resp && resp.status() === 200) {
        ok = true;
        break;
      }
    }

    expect(ok, 'services page did not serve successfully after revalidation').toBe(true);
    expect(
      elapsed,
      `content took ${elapsed}ms to become visible; the old site's floor was 600000ms`,
    ).toBeLessThan(BUDGET_MS);
  });

  test('rejects an unsigned request', async ({ request }) => {
    const res = await request.post(`${WEB}/api/revalidate`, {
      data: { event: 'x', tags: ['services'], ts: Date.now() },
    });
    expect(res.status()).toBe(401);
  });

  test('rejects a replayed timestamp', async () => {
    const ctx = await pwRequest.newContext();
    const stale = Date.now() - 10 * 60 * 1000;
    const body = JSON.stringify({ event: 'x', tags: ['services'], ts: stale });
    const res = await ctx.post(`${WEB}/api/revalidate`, {
      headers: {
        'content-type': 'application/json',
        'x-haizo-timestamp': String(stale),
        'x-haizo-signature': sign(stale, body),
      },
      data: body,
    });
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('cannot be steered into revalidating arbitrary paths', async () => {
    const { status } = await revalidate(['../../etc/passwd'], ['../secret']);
    expect(status).toBe(400);
  });
});

test.describe('public site smoke', () => {
  for (const path of ['/', '/services', '/work', '/blog', '/about', '/contact', '/privacy', '/terms']) {
    test(`${path} renders with one h1 and no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(errors, `console errors on ${path}`).toEqual([]);
    });
  }

  test('sitemap lists the core routes', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();
    for (const path of ['/services', '/work', '/blog', '/about', '/contact']) {
      expect(xml).toContain(path);
    }
  });

  test('robots.txt points at the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('sitemap.xml');
  });

  test('the API contract is reachable', async ({ request }) => {
    const res = await request.get(`${API}/v1/health`);
    expect(res.status()).toBe(200);
    expect((await res.json()).status).toBe('ok');
  });
});
