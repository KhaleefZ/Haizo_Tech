import { test, expect } from '@playwright/test';

/**
 * Guards the Tailwind v4 translate-vs-transform trap.
 *
 * Every reveal on the site once faded without moving, because translate-y-*
 * lands on the `translate` property while the transition only listed
 * `transform`. This test fails if that regresses anywhere.
 */
const PAGES = ['/', '/services', '/work', '/blog', '/about', '/contact'];

for (const path of PAGES) {
  test(`${path} animates movement, not just opacity`, async ({ page }) => {
    await page.goto(path);

    const offenders = await page.evaluate(() => {
      const bad: string[] = [];
      document.querySelectorAll<HTMLElement>('*').forEach((el) => {
        const cs = getComputedStyle(el);
        const usesTranslate = cs.translate !== 'none' && cs.translate !== '';
        const transitions = cs.transitionProperty;
        if (!usesTranslate || transitions === 'none' || transitions === 'all') return;
        // It moves and it transitions something — but not `translate`.
        if (!transitions.includes('translate')) {
          bad.push(`${el.tagName}.${el.className.toString().slice(0, 50)} :: ${transitions}`);
        }
      });
      return bad.slice(0, 5);
    });

    expect(offenders, `elements that translate but do not transition translate on ${path}`).toEqual([]);
  });
}
