// The intro gate (src/render/intro-gate.ts): preloads, the hold until the font and both hero pictures are ready
// (or 1.2 s), no JavaScript, the fallback when the gate never runs, and the first blink and glance on a cold load.
import { test, expect, type Page } from '@playwright/test';

const rise = (page: Page) => page.evaluate(() => document.getAnimations()
  .filter((a) => (a as CSSAnimation).animationName === 'rise').map((a) => a.playState));
/** Holds the hero pictures back by `ms`. */
const slowHero = (page: Page, ms: number) => page.route(/-hero-\d+-[^/]*\.(avif|webp)$/, async (route) => {
  await new Promise((r) => setTimeout(r, ms));
  await route.continue();
});

test('the font and both hero pictures are preloaded', async ({ page, request }) => {
  await page.goto('./');
  const font = page.locator('link[rel="preload"][as="font"]');
  await expect(font).toHaveCount(1);
  await expect(font).toHaveAttribute('type', 'font/woff2');
  await expect(font).toHaveAttribute('crossorigin', '');
  const href = await font.evaluate((l: HTMLLinkElement) => l.href);
  expect(href).toMatch(/anton-latin-400-normal-.*\.woff2$/);
  expect((await request.get(href)).ok()).toBe(true);
  const imgs = page.locator('link[rel="preload"][as="image"]');
  await expect(imgs).toHaveCount(2);
  for (const [i, who] of ['bro', 'zara'].entries()) {
    await expect(imgs.nth(i)).toHaveAttribute('type', 'image/avif');
    await expect(imgs.nth(i)).toHaveAttribute('fetchpriority', 'high');
    await expect(imgs.nth(i)).toHaveAttribute('imagesrcset', new RegExp(`${who}-hero-520-.*\\.avif 520w, .*${who}-hero-820-.*\\.avif 820w, .*${who}-hero-1254-.*\\.avif 1254w`));
    // the same srcset and sizes the page's picture uses, so the preload is the file it paints
    const page_ = await page.locator(`.face--${who} .pic__main source[type="image/avif"]`).evaluate((s) => [s.getAttribute('srcset'), s.getAttribute('sizes')]);
    expect([await imgs.nth(i).getAttribute('imagesrcset'), await imgs.nth(i).getAttribute('imagesizes')]).toEqual(page_);
  }
});

test('the intro holds, showing only the lockup, until the font and both pictures are ready', async ({ page }) => {
  await slowHero(page, 700);
  // note the state of things on the frame the intro is let go
  await page.addInitScript(() => {
    new MutationObserver((_, obs) => {
      const hero = document.querySelector<HTMLElement>('.hero');
      if (!hero?.classList.contains('is-go')) return;
      obs.disconnect();
      const imgs = [...hero.querySelectorAll<HTMLImageElement>('.pic__main img')];
      (window as unknown as { __atGo: object }).__atGo = {
        pictures: imgs.map((i) => i.complete && i.naturalWidth > 0),
        anton: document.fonts.check('400 100px Anton'),
      };
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
  });
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  await expect(page.locator('.hero')).not.toHaveClass(/is-go/);
  expect(new Set(await rise(page))).toEqual(new Set(['paused']));
  // only the background and the lockup: the letters are still below their masks, the rest is transparent
  await expect(page.locator('.hero__brand svg')).toBeVisible();
  expect(await page.locator('.ltr').first().evaluate((n) => getComputedStyle(n).transform)).not.toBe('none');
  for (const sel of ['.hero__status', '.chooser', '.fig--bro']) expect(await page.locator(sel).evaluate((n) => getComputedStyle(n).opacity)).toBe('0');

  await expect(page.locator('.hero')).toHaveClass(/is-go/, { timeout: 3000 });
  await expect(page.locator('.hero')).toHaveAttribute('data-intro-why', 'ready');
  expect(await page.evaluate(() => (window as unknown as { __atGo: object }).__atGo)).toEqual({ pictures: [true, true], anton: true });
  expect(new Set(await rise(page))).toEqual(new Set(['running']));
});

test('with the pictures stuck, the intro starts anyway at the 1.2 s cap', async ({ page }) => {
  await slowHero(page, 4000);
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.hero')).toHaveClass(/is-go/, { timeout: 3000 });
  await expect(page.locator('.hero')).toHaveAttribute('data-intro-why', 'cap');
  const [gate, go] = await page.locator('.hero').evaluate((h) => [Number(h.dataset.gateAt), Number(h.dataset.introAt)]);
  expect(go - gate).toBeGreaterThanOrEqual(1190);
  expect(go - gate).toBeLessThan(1500);
});

test('without JavaScript the intro runs at once', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('./');
  expect(await page.locator('.ltr').first().evaluate((n) => getComputedStyle(n).animationPlayState)).toBe('running');
  await expect.poll(() => page.locator('.hero__status').evaluate((n) => getComputedStyle(n).opacity), { timeout: 5000 }).toBe('1');
  await ctx.close();
});

test('if the gate never runs (say the CSP refused it), the main script starts the intro', async ({ page }) => {
  // serve the page without its inline gate (as if the CSP had blocked it)
  await page.route(/\/broski-site\/$/, async (route) => {
    const res = await route.fetch();
    const html = (await res.text()).replace(/<script>\(function \(\) \{[\s\S]*?\}\)\(\);<\/script>/, '');
    await route.fulfill({ response: res, body: html });
  });
  await page.goto('./');
  expect(await page.evaluate(() => document.querySelectorAll('main script').length)).toBe(0);
  await expect(page.locator('.hero')).toHaveAttribute('data-intro-why', 'fallback');
  expect(new Set(await rise(page))).toEqual(new Set(['running']));
});

test('cold load: the first blink comes 1–2 s after the intro and the first glance 2.5–4.5 s, both with their pictures loaded', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); // a fresh context: nothing cached
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    const w = window as unknown as { __first: Record<string, [number, boolean]> };
    w.__first = {};
    new MutationObserver((rs) => rs.forEach((r) => {
      const t = r.target as HTMLElement;
      const now = performance.now();
      if (t.classList.contains('hero') && t.classList.contains('is-alive') && !w.__first.alive) w.__first.alive = [now, true];
      if (!t.classList.contains('pic__x') || !t.classList.contains('is-on')) return;
      const kind = t.classList.contains('pic__x--blink') ? 'blink' : 'glance';
      if (w.__first[kind]) return;
      const img = t.querySelector('img')!;
      w.__first[kind] = [now, img.complete && img.naturalWidth > 0];
    })).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
  });
  await page.goto('./');
  await page.waitForFunction(() => (window as unknown as { __first: Record<string, unknown> }).__first.glance, null, { timeout: 12000 });
  const f = await page.evaluate(() => (window as unknown as { __first: Record<string, [number, boolean]> }).__first);
  const blink = f.blink[0] - f.alive[0];
  const glance = f.glance[0] - f.alive[0];
  expect(blink).toBeGreaterThanOrEqual(990);
  expect(blink).toBeLessThanOrEqual(2250);
  expect(f.blink[1]).toBe(true);
  expect(glance).toBeGreaterThanOrEqual(2490);
  expect(glance).toBeLessThanOrEqual(4750);
  expect(f.glance[1]).toBe(true);
  await ctx.close();
});
