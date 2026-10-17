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

test('the favicon (small-size icon, SVG + 32 px PNG) and the 180 px apple-touch-icon resolve', async ({ page, request }) => {
  await page.goto('./');
  const links = await page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').evaluateAll((ls) => ls.map((l) => ({
    rel: l.getAttribute('rel'), href: (l as HTMLLinkElement).href, type: l.getAttribute('type'), sizes: l.getAttribute('sizes'),
  })));
  expect(links.map((l) => l.rel).sort()).toEqual(['apple-touch-icon', 'icon', 'icon']);
  const pngSize = (b: Buffer) => [b.readUInt32BE(16), b.readUInt32BE(20)];

  const svgLink = links.find((l) => l.type === 'image/svg+xml')!;
  expect(svgLink.href).toMatch(/\/favicon-v2\.svg$/); // a new name, so cached copies of the old one are skipped
  const svg = await request.get(svgLink.href);
  expect(svg.ok()).toBe(true);
  expect(svg.headers()['content-type']).toContain('image/svg+xml');
  const svgText = await svg.text();
  expect(svgText).toContain('#C0667C'); // the rose brow
  expect(svgText).toContain('stroke-width="10"'); // the heavy-stroke icon made for 16–32 px
  expect(svgText).not.toContain('#C15F42'); // the old "B/" mark's slash

  const pngLink = links.find((l) => l.type === 'image/png')!;
  expect(pngLink.href).toMatch(/\/favicon-32\.png$/);
  expect(pngLink.sizes).toBe('32x32');
  const png = await request.get(pngLink.href);
  expect(png.ok()).toBe(true);
  expect(png.headers()['content-type']).toContain('image/png');
  expect(pngSize(await png.body())).toEqual([32, 32]);

  const touch = await request.get(links.find((l) => l.rel === 'apple-touch-icon')!.href);
  expect(touch.ok()).toBe(true);
  expect(touch.headers()['content-type']).toContain('image/png');
  expect(pngSize(await touch.body())).toEqual([180, 180]);

  // the old favicon is gone (the preview server may answer with the page itself, but never with an SVG)
  const old = await request.get(new URL('favicon.svg', page.url()).href);
  expect(old.headers()['content-type'] ?? '').not.toContain('image/svg+xml');
});
