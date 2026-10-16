import { test, expect } from '@playwright/test';
import { gotoScene, noHorizontalScroll, IDS, TIMES, visibleDigits, waitForSceneOpaque } from './helpers';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

test('phone: no horizontal scroll anywhere on the page', async ({ page }) => {
  await page.goto('./');
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 900) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(40);
    expect(await noHorizontalScroll(page)).toBe(true);
  }
});

test('phone: the dial stays pinned and every scene is reachable', async ({ page }) => {
  await page.goto('./');
  let top: number | null = null;
  for (let i = 0; i < 12; i++) {
    await gotoScene(page, i);
    await expect(page.locator('.scene.is-active')).toHaveAttribute('id', IDS[i]);
    await waitForSceneOpaque(page, IDS[i]);
    expect(await visibleDigits(page)).toEqual([TIMES[i]]);
    const box = (await page.locator('.dial').boundingBox())!;
    if (top === null) top = box.y;
    expect(Math.abs(box.y - top)).toBeLessThan(2);
    // the scene's widget fits on screen
    const w = (await page.locator(`#${IDS[i]} .scene__w`).boundingBox())!;
    expect(w.x + w.width).toBeLessThanOrEqual(390);
    expect(w.y + w.height).toBeLessThanOrEqual(844 + 1);
    expect(await noHorizontalScroll(page)).toBe(true);
  }
});

test('phone: the hero is the bottom-sheet chooser', async ({ page }) => {
  await page.goto('./');
  const sheet = page.locator('.chooser');
  const box = (await sheet.boundingBox())!;
  expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(840);
  await page.locator('.hero [data-pick="zara"]').tap();
  await expect(page.locator('.hero')).toHaveAttribute('data-who', 'zara');
});
