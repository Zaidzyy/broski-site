import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test('reduced motion: twelve still sections, no pinning, final states', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.day')).not.toHaveClass(/is-live/);
  await expect(page.locator('.scene')).toHaveCount(12);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.day__stage')!).position)).toBe('static');
  await expect(page.locator('.dial')).toBeHidden();
  await expect(page.locator('.day__bar')).toBeHidden();
  for (const s of await page.locator('.scene').all()) {
    await s.scrollIntoViewIfNeeded();
    await expect(s).toBeVisible();
    expect(await s.evaluate((n) => getComputedStyle(n).opacity)).toBe('1');
  }
  // every widget part is in its final state (nothing waiting to animate in)
  const waiting = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.scene [data-a]')].filter((n) => getComputedStyle(n).opacity !== '1').length);
  expect(waiting).toBe(0);
  // the hero intro is skipped
  expect(await page.locator('.hero__head').evaluate((n) => getComputedStyle(n).opacity)).toBe('1');
});
