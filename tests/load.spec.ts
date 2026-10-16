import { test, expect } from '@playwright/test';

test('loads with no console errors and no requests outside its own origin, at load and while scrolling', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const errors: string[] = [];
  const foreign: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(origin) && !u.startsWith('data:')) foreign.push(u); });

  await page.goto('./');
  await page.waitForLoadState('networkidle');
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 700) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(60);
  }
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
  expect(foreign).toEqual([]);
});

test('has the CSP, the meta, one h1 and the Arabic word marked up', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const ar = page.locator('[lang="ar"]');
  await expect(ar).toHaveAttribute('dir', 'rtl');
  await expect(ar).toHaveText('كتاب');
});

test('no cookies and no storage are written', async ({ page, context }) => {
  await page.goto('./');
  await page.locator('.hero [data-pick="bro"]').click();
  await page.waitForTimeout(300);
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});
