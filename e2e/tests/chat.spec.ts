import { test, expect, type Browser, type BrowserContext } from '@playwright/test';

/**
 * THE Phase 7 exit test: internal team chat across two real browsers.
 *
 * Two independent sessions (different cookie jars) open the same DM and we assert
 * the properties that only a true realtime system gets right: a message sent in
 * one window appears in the other, typing shows through, read receipts advance,
 * a message sent while a peer is offline is caught up on reconnect (exactly once,
 * no duplicate), and the unread badge rises then clears on read.
 *
 * Desktop only — the two-pane layout needs the width. Run with --project=chromium.
 */
const ADMIN = process.env.ADMIN_URL ?? 'http://localhost:3001';
const API = process.env.API_URL ?? 'http://localhost:5001';

const A = { email: 'dev-admin@haizotech.com', password: 'DevAdmin123!', name: 'Dev Admin' };
const B = { email: 'dev@haizotech.com', password: 'DevUser123!', name: 'Dev User' };

async function signedIn(browser: Browser, creds: { email: string; password: string }): Promise<BrowserContext> {
  const ctx = await browser.newContext({ baseURL: ADMIN });
  // Log in via the API into this context's cookie jar (shared with its pages).
  const res = await ctx.request.post(`${API}/v1/auth/login`, {
    data: { email: creds.email, password: creds.password },
  });
  expect(res.ok(), `login ${creds.email}`).toBeTruthy();
  return ctx;
}

test('team chat works across two browsers', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'chat e2e is desktop-only');

  const ctxA = await signedIn(browser, A);
  const ctxB = await signedIn(browser, B);
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  await pageA.goto('/chat');
  await pageB.goto('/chat');

  // Open the mutual DM in both windows (scoped to the conversation list).
  await pageA.locator('aside button', { hasText: B.name }).first().click();
  await pageB.locator('aside button', { hasText: A.name }).first().click();

  const composerA = pageA.getByPlaceholder(/^Message /);
  const composerB = pageB.getByPlaceholder(/^Message /);
  await expect(composerA).toBeVisible();
  await expect(composerB).toBeVisible();
  // Let both sockets finish connecting and joining the conversation room.
  await pageA.waitForTimeout(1000);

  // 1) Realtime send/receive.
  const m1 = `hello-${Date.now()}`;
  await composerA.fill(m1);
  await composerA.press('Enter');
  await expect(pageB.getByText(m1)).toBeVisible();

  // 2) Typing indicator surfaces in the peer window. Real keystrokes so the
  //    throttled typing signal fires.
  await composerA.click();
  await composerA.pressSequentially('drafting a longer reply', { delay: 60 });
  await expect(pageB.getByText(new RegExp(`${A.name} is typing`))).toBeVisible();
  await composerA.fill('');

  // 3) Read receipt: B has the DM open, so m1 is read and A sees it.
  await expect(pageA.getByText(/·\s*Read/).last()).toBeVisible();

  // 4) Reconnect loses no messages: B drops offline, A sends, B returns.
  await ctxB.setOffline(true);
  const m2 = `offline-${Date.now()}`;
  await composerA.fill(m2);
  await composerA.press('Enter');
  await expect(pageA.getByText(m2)).toBeVisible(); // A still sent it
  await pageB.waitForTimeout(800); // B is offline; shouldn't have it yet
  await ctxB.setOffline(false);
  // On reconnect the thread refetches history — the message shows up, exactly once.
  await expect(pageB.getByText(m2)).toHaveCount(1);

  // 5) Unread badge rises while away, clears on read.
  await pageB.goto('/');
  const m3 = `unread-${Date.now()}`;
  await composerA.fill(m3);
  await composerA.press('Enter');
  const navChat = pageB.getByRole('link', { name: /Chat/ });
  await expect(navChat).toContainText(/[0-9]/); // badge appeared
  await navChat.click();
  await pageB.locator('aside button', { hasText: A.name }).first().click();
  await expect(navChat).not.toContainText(/[0-9]/); // cleared on read

  await ctxA.close();
  await ctxB.close();
});
