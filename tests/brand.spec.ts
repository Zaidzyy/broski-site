// The L2 lockup in the header, the favicon and the apple-touch-icon.
import { test, expect } from '@playwright/test';

test('the header shows the L2 lockup as a link back to the top, with no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const brand = page.getByRole('link', { name: 'Broski, back to top' });
  await expect(brand).toBeVisible();
  await expect(brand).toHaveAttribute('href', '#top');
  const svg = brand.locator('svg.lockup');
  await expect(svg).toHaveAttribute('aria-hidden', 'true');
  await expect(svg.locator('.brow')).toHaveCount(2);
  const h = (await svg.boundingBox())!.height;
  expect(Math.abs(h - 30)).toBeLessThan(1);
  // fixed brand colours: picking a persona doesn't tint it
  const strokes = () => svg.locator('.brow').evaluateAll((ls) => ls.map((l) => getComputedStyle(l).stroke));
  expect(await strokes()).toEqual(['rgb(192, 102, 124)', 'rgb(192, 102, 124)']);
  await page.locator('.hero [data-pick="bro"]').click();
  expect(await strokes()).toEqual(['rgb(192, 102, 124)', 'rgb(192, 102, 124)']);
  expect(errors).toEqual([]);
});

test('hovering the lockup lifts both brows, and they settle back on leave', async ({ page }) => {
  await page.goto('./');
  const brows = page.locator('.hero__brand .brow');
  const angles = () => brows.evaluateAll((ls) => ls.map((l) => {
    const t = getComputedStyle(l).transform;
    if (t === 'none') return 0;
    const [a, b] = t.slice(7, -1).split(',').map(Number);
    return Math.round((Math.atan2(b, a) * 180) / Math.PI);
  }));
  expect(await angles()).toEqual([0, 0]);
  await page.locator('.hero__brand').hover();
  await expect.poll(angles).toEqual([-8, -8]);
  await page.mouse.move(700, 600);
  await expect.poll(angles).toEqual([0, 0]);
});

test('phone: the lockup is about 26 px tall', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('./');
  const h = (await page.locator('.hero__brand svg').boundingBox())!.height;
  expect(Math.abs(h - 26)).toBeLessThan(1);
  await ctx.close();
});

test('the favicon and apple-touch-icon links resolve to the new tile', async ({ page, request }) => {
  await page.goto('./');
  const links = await page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').evaluateAll((ls) => ls.map((l) => [l.getAttribute('rel'), (l as HTMLLinkElement).href]));
  expect(links.map(([rel]) => rel).sort()).toEqual(['apple-touch-icon', 'icon']);
  for (const [rel, href] of links) {
    const res = await request.get(href!);
    expect(res.ok()).toBe(true);
    if (rel === 'icon') {
      expect(res.headers()['content-type']).toContain('image/svg+xml');
      const svg = await res.text();
      expect(svg).toContain('#C0667C'); // the rose brow
      expect(svg).not.toContain('#C15F42'); // the old "B/" mark's slash
    } else {
      expect(res.headers()['content-type']).toContain('image/png');
      const png = await res.body();
      expect(png.readUInt32BE(16)).toBe(180); // width
      expect(png.readUInt32BE(20)).toBe(180); // height
    }
  }
});
