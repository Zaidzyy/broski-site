// Motion is always on (Zaid's call): an OS "reduce motion" setting does not switch the page to the
// still layout. The still layout is only for no JavaScript and windows under 520 px tall (review.spec.ts).
import { test, expect } from '@playwright/test';
import { gotoScene, waitForSceneOpaque, visibleDigits, IDS, TIMES } from './helpers';

test.use({ reducedMotion: 'reduce' });

test('reduced motion emulated: the hero intro still plays', async ({ page }) => {
  await page.goto('./');
  expect(await page.locator('.ltr').first().evaluate((n) => getComputedStyle(n).animationName)).toBe('rise');
  expect(await page.locator('.hero__head').evaluate((n) => getComputedStyle(n).animationName)).toBe('fadein');
  await expect.poll(() => page.locator('.hero__head').evaluate((n) => getComputedStyle(n).opacity), { timeout: 5000 }).toBe('1');
});

test('reduced motion emulated: the day is pinned and its scenes play', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.day')).toHaveClass(/is-live/);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.day__stage')!).position)).toBe('sticky');
  // the 12:30 widgets wait to animate in, then play once on entry
  const pop = page.locator('#s1230 [data-a="pop"]').first();
  expect(Number(await pop.evaluate((n) => getComputedStyle(n).opacity))).toBe(0);
  await gotoScene(page, 5);
  await waitForSceneOpaque(page, IDS[5]);
  expect(await visibleDigits(page)).toEqual([TIMES[5]]);
  await expect.poll(() => pop.evaluate((n) => Number(getComputedStyle(n).opacity)), { timeout: 4000 }).toBe(1);
  const box = (await page.locator('.dial').boundingBox())!;
  expect(box.y).toBeGreaterThan(0);
  expect(box.y + box.height).toBeLessThan(900);
  // the CSS loops run too
  expect(await page.locator('.wave > span').first().evaluate((n) => getComputedStyle(n).animationName)).not.toBe('none');
});

test('reduced motion emulated on a phone: the day is still pinned', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('./');
  await expect(page.locator('.day')).toHaveClass(/is-live/);
  await gotoScene(page, 8);
  await waitForSceneOpaque(page, IDS[8]);
  await expect(page.locator('.dial')).toBeVisible();
  await ctx.close();
});
