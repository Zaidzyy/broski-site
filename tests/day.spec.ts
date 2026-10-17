import { test, expect } from '@playwright/test';
import { dayReady, gotoScene, visibleDigits, waitForSceneOpaque, activeScene, TIMES, IDS, type DayHook } from './helpers';

test.describe('the day (desktop)', () => {
  test('each scene shows at its scroll position, and the dial digits match', async ({ page }) => {
    await page.goto('./');
    await dayReady(page);
    for (let i = 0; i < 12; i++) {
      await gotoScene(page, i);
      await expect(page.locator('.scene.is-active')).toHaveAttribute('id', IDS[i]);
      await waitForSceneOpaque(page, IDS[i]);
      await expect(page.locator(`#${IDS[i]} .scene__tag`)).toContainText(TIMES[i]);
      expect(await visibleDigits(page)).toEqual([TIMES[i]]);
      // pinned: the dial stays on screen
      const box = await page.locator('.dial').boundingBox();
      expect(box!.y).toBeGreaterThan(0);
      expect(box!.y + box!.height).toBeLessThan(900);
    }
  });

  test('the ending turns the arc into the 72', async ({ page }) => {
    await page.goto('./');
    await dayReady(page);
    await page.evaluate(() => { const d = (window as unknown as { __day: DayHook }).__day; window.scrollTo(0, d.yFor(d.UNITS)); });
    await expect.poll(() => page.evaluate(() => Number(getComputedStyle(document.querySelector('[data-score]')!).opacity)), { timeout: 5000 }).toBeGreaterThan(0.95);
    await expect(page.locator('[data-score] .ctr__72')).toHaveText('72');
  });

  test('hour chips jump to their scene', async ({ page }) => {
    await page.goto('./');
    await dayReady(page);
    await gotoScene(page, 0);
    for (const i of [7, 2, 11]) {
      await page.locator(`[data-go="${i}"]`).click();
      await expect.poll(() => activeScene(page), { timeout: 5000 }).toBe(i);
      await expect(page.locator(`[data-go="${i}"]`)).toHaveAttribute('aria-current', 'true');
      await waitForSceneOpaque(page, IDS[i]);
      await expect.poll(() => visibleDigits(page), { timeout: 4000 }).toEqual([TIMES[i]]);
    }
  });

  test('Play runs, and stops when pressed again', async ({ page }) => {
    await page.goto('./');
    await dayReady(page);
    await gotoScene(page, 0);
    const play = page.locator('[data-play]');
    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'true');
    const y0 = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(2500);
    const y1 = await page.evaluate(() => window.scrollY);
    expect(y1).toBeGreaterThan(y0 + 200);
    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'false');
    const y2 = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.scrollY)).toBe(y2);
  });

  test('the intro pill starts Play', async ({ page }) => {
    await page.goto('./');
    await dayReady(page);
    await page.locator('[data-play-intro]').click();
    await expect(page.locator('[data-play]')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => (window as unknown as { __day: DayHook }).__day.t()), { timeout: 6000 }).toBeGreaterThan(0.05);
    await page.locator('[data-play]').click();
    await expect(page.locator('[data-play]')).toHaveAttribute('aria-pressed', 'false');
  });
});
