// Regression tests for the two review passes (fidelity; public content, privacy and accessibility).
import { test, expect } from '@playwright/test';
import { gotoScene } from './helpers';

const ROSE = 'rgb(216, 138, 156)';

test('the dial tick rings fill the dial (no clash with section 03 ring styles)', async ({ page }) => {
  await page.goto('./');
  await gotoScene(page, 0);
  const dial = (await page.locator('.dial').boundingBox())!;
  for (const ring of ['.ring--minor', '.ring--major']) {
    const box = (await page.locator(ring).boundingBox())!;
    expect(Math.abs(box.width - dial.width)).toBeLessThan(1);
    expect(Math.abs(box.x - dial.x)).toBeLessThan(1);
    expect(Math.abs(box.y - dial.y)).toBeLessThan(1);
  }
});

test('accent micro labels keep the accent colour', async ({ page }) => {
  await page.goto('./');
  const color = (sel: string) => page.locator(sel).first().evaluate((n) => getComputedStyle(n).color);
  expect(await color('.flash__back .micro')).toBe(ROSE);
  expect(await color('.fring__c .acc')).toBe(ROSE);
});

test('the caption of the face that was not picked dims', async ({ page }) => {
  await page.goto('./');
  await page.locator('.hero [data-pick="bro"]').click();
  await expect.poll(() => page.locator('.fig--zara .fig__k').evaluate((n) => Number(getComputedStyle(n).opacity)), { timeout: 3500 }).toBeLessThan(0.3);
  expect(await page.locator('.fig--bro .fig__k').evaluate((n) => Number(getComputedStyle(n).opacity))).toBe(1);
});

test('a short window (landscape phone, heavy zoom) gets the still day, not the pinned one', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const page = await ctx.newPage();
  await page.goto('./');
  await expect(page.locator('.day')).not.toHaveClass(/is-live/);
  await expect(page.locator('.scene').nth(5)).toBeVisible();
  await ctx.close();
});

test('without JavaScript every scene and all six feature groups are readable', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('./');
  await expect(page.locator('.bento:visible')).toHaveCount(6);
  await expect(page.locator('.scene')).toHaveCount(12);
  await page.locator('#s2300').scrollIntoViewIfNeeded();
  await expect(page.locator('#s2300 .scene__h')).toBeVisible();
  await ctx.close();
});

test('a bad email is flagged on the field itself', async ({ page }) => {
  await page.route('https://formspree.io/**', (route) => route.abort()); // never the real form
  await page.goto('./');
  await page.getByLabel('The whole thing').check({ force: true });
  const email = page.locator('[data-vote] input[type="email"]');
  await email.fill('nope');
  await page.getByRole('button', { name: 'Count me in' }).click();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute('aria-describedby', 'vote-err');
});

test('hero controls are visible while focused during the intro', async ({ page }) => {
  await page.goto('./');
  await page.locator('.hero [data-pick="zara"]').focus();
  expect(await page.locator('.chooser').evaluate((n) => getComputedStyle(n).opacity)).toBe('1');
});

// ---- follow-up fixes ----

for (const width of [360, 390, 430]) {
  test(`phone ${width}px: the top of Zara's picture fades out instead of ending on a hard edge`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('./');
    const mask = await page.locator('.face--zara .pic').evaluate((n) => {
      const cs = getComputedStyle(n);
      return cs.maskImage || cs.webkitMaskImage;
    });
    // starts fully transparent at the top edge, then fades in
    expect(mask).toMatch(/^linear-gradient\((rgba\(0, 0, 0, 0\)|transparent) 0(px|%)?,/);
    await ctx.close();
  });
}

test('03: every bento card has its own mark: one lit tick on a 36-tick ring', async ({ page }) => {
  await page.goto('./');
  const marks = await page.locator('.bento .tile__mark').evaluateAll((svgs) =>
    svgs.map((s) => ({ lit: s.querySelector('.tk-on')!.getAttribute('d'), ticks: (s.querySelector('.tk')!.getAttribute('d')!.match(/M/g) || []).length })));
  expect(marks).toHaveLength(36);
  expect(new Set(marks.map((m) => m.lit)).size).toBe(36);
  for (const m of marks) expect(m.ticks).toBe(35);
  const lit = await page.locator('#panel-learn .tile').nth(1).locator('.tk-on').evaluate((n) => getComputedStyle(n).stroke);
  expect(lit).toBe(ROSE);
});

test('phone day: the scene dots sit on the outer track, clear of the sky window', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('./');
  await gotoScene(page, 5);
  const r = await page.evaluate(() => {
    const win = document.querySelector('.win')!.getBoundingClientRect();
    const cx = win.left + win.width / 2, cy = win.top + win.height / 2;
    return [...document.querySelectorAll('.dot')].map((d) => {
      const b = d.getBoundingClientRect();
      return { inner: Math.hypot(b.left + b.width / 2 - cx, b.top + b.height / 2 - cy) - b.width / 2, win: win.width / 2 };
    });
  });
  expect(r).toHaveLength(12);
  for (const d of r) expect(d.inner).toBeGreaterThan(d.win);
  await ctx.close();
});
