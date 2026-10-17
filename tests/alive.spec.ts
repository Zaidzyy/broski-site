// The "alive" pass: hero breathing, parallax, blinks and glances; the 03 wandering tick; the 04 live log.
import { test, expect, type Page } from '@playwright/test';

const introOver = (page: Page) => expect(page.locator('.hero')).toHaveClass(/is-alive/, { timeout: 5000 });
const playState = (page: Page) => page.locator('.face--bro .breath').evaluate((n) => getComputedStyle(n).animationPlayState);

test('breathing starts after the intro and pauses off screen and in a hidden tab', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.hero')).not.toHaveClass(/is-alive/); // nothing moves during the intro
  await introOver(page);
  expect(await page.locator('.face--bro .breath').evaluate((n) => getComputedStyle(n).animationName)).toBe('breathe');
  expect(await playState(page)).toBe('running');
  // the two faces breathe out of sync
  const durations = await page.locator('.breath').evaluateAll((ns) => ns.map((n) => getComputedStyle(n).animationDuration));
  expect(durations).toEqual(['5.5s', '6.3s']);

  await page.locator('.foot').scrollIntoViewIfNeeded();
  await expect.poll(() => playState(page)).toBe('paused');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => playState(page)).toBe('running');

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => playState(page)).toBe('paused');
});

test('a blink frame appears within ~8 s of the intro and goes away again', async ({ page }) => {
  await page.goto('./');
  await introOver(page);
  // a blink lasts 130 ms, too short to poll for: watch the class changes instead
  await page.evaluate(() => {
    const w = window as unknown as { __blink: { on?: number; off?: number; loaded?: boolean } };
    w.__blink = {};
    new MutationObserver((rs) => rs.forEach((r) => {
      const t = r.target as HTMLElement;
      if (!t.classList.contains('pic__x--blink')) return;
      if (t.classList.contains('is-on') && w.__blink.on === undefined) {
        w.__blink.on = performance.now();
        const img = t.querySelector('img')!;
        w.__blink.loaded = img.complete && img.naturalWidth > 0;
      } else if (!t.classList.contains('is-on') && w.__blink.on !== undefined && w.__blink.off === undefined) {
        w.__blink.off = performance.now();
      }
    })).observe(document.querySelector('.hero')!, { attributes: true, subtree: true, attributeFilter: ['class'] });
  });
  await page.waitForFunction(() => (window as unknown as { __blink: { off?: number } }).__blink.off !== undefined, null, { timeout: 8500 });
  const b = await page.evaluate(() => (window as unknown as { __blink: { on: number; off: number; loaded: boolean } }).__blink);
  expect(b.loaded).toBe(true); // the frame had really loaded
  expect(b.off - b.on).toBeGreaterThan(80); // ~130 ms, no fade
  expect(b.off - b.on).toBeLessThan(400);
  await expect(page.locator('.pic__x--blink.is-on')).toHaveCount(0);
});

test('glances: one persona at a time, taking turns, never over a blink', async ({ page }) => {
  await page.addInitScript(() => { (window as unknown as { __aliveSpeed: number }).__aliveSpeed = 10; });
  await page.goto('./');
  await introOver(page);
  // record every overlay change, then replay them in order
  await page.evaluate(() => {
    const w = window as unknown as { __log: [string, string, string, boolean][] };
    w.__log = [];
    new MutationObserver((rs) => rs.forEach((r) => {
      const t = r.target as HTMLElement;
      if (!t.classList.contains('pic__x')) return;
      w.__log.push([t.closest('.face')!.classList.contains('face--bro') ? 'bro' : 'zara', t.classList.contains('pic__x--blink') ? 'blink' : 'glance', t.dataset.x!, t.classList.contains('is-on')]);
    })).observe(document.querySelector('.hero')!, { attributes: true, subtree: true, attributeFilter: ['class'] });
  });
  await page.waitForTimeout(5000); // ~50 s on the alive clock
  const log = await page.evaluate(() => (window as unknown as { __log: [string, string, string, boolean][] }).__log);
  const on = new Set<string>();
  let most = 0;
  const glancers: string[] = [];
  for (const [who, kind, ex, isOn] of log) {
    const key = `${who}:${kind}:${ex}`;
    if (isOn) {
      if (kind === 'glance') {
        glancers.push(who);
        expect(on.has(`${who}:blink:blink`)).toBe(false);
      }
      on.add(key);
    } else on.delete(key);
    most = Math.max(most, [...on].filter((k) => k.includes(':glance:')).length);
  }
  expect(glancers.length).toBeGreaterThanOrEqual(3);
  expect(most).toBe(1);
  glancers.slice(1).forEach((g, i) => expect(g).not.toBe(glancers[i])); // they take turns
});

test('parallax follows a fine pointer; touch gets the slow drift instead', async ({ page, browser }) => {
  await page.goto('./');
  await introOver(page);
  await page.mouse.move(100, 100);
  await page.mouse.move(200, 150, { steps: 4 });
  await expect.poll(() => page.locator('.face--bro .pic').evaluate((n) => (n as HTMLElement).style.translate)).not.toBe('');
  const [face, word] = await page.evaluate(() => [
    (document.querySelector('.pic') as HTMLElement).style.translate, (document.querySelector('.word') as HTMLElement).style.translate,
  ]);
  // the cursor is up and to the left: the faces drift towards it, the letters away
  expect(parseFloat(face)).toBeLessThan(0);
  expect(parseFloat(word)).toBeGreaterThan(0);

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const phone = await ctx.newPage();
  await phone.goto('./');
  await introOver(phone);
  await phone.mouse.move(50, 50);
  await phone.mouse.move(300, 400, { steps: 4 });
  await phone.waitForTimeout(300);
  expect(await phone.locator('.face--bro .pic').evaluate((n) => (n as HTMLElement).style.translate)).toBe('');
  expect(await phone.locator('.face--bro .pic').evaluate((n) => getComputedStyle(n).animationName)).toBe('drift');
  await ctx.close();
});

test('03: a lit tick wanders round the ring until someone hovers', async ({ page }) => {
  await page.goto('./');
  await introOver(page);
  await page.locator('#everything').scrollIntoViewIfNeeded();
  await page.mouse.move(5, 5);
  const wandering = () => page.evaluate(() => [...document.querySelectorAll('.fring .mark')].findIndex((m) => m.classList.contains('is-wander')));
  await expect.poll(wandering, { timeout: 3000 }).toBeGreaterThanOrEqual(0);
  const first = await wandering();
  await expect.poll(wandering, { timeout: 3000 }).not.toBe(first);
  // never on the chosen group's arc
  expect(await page.locator('.fring .mark.is-wander.is-on').count()).toBe(0);

  await page.locator('.fring__c').hover();
  await expect.poll(wandering).toBe(-1);
  await page.waitForTimeout(1500);
  expect(await wandering()).toBe(-1);
});

test('04: the laptop log advances while on screen and stops off screen', async ({ page }) => {
  await page.goto('./');
  await introOver(page);
  const lines = () => page.locator('.lap__log li').allTextContents();
  await page.locator('.lap').scrollIntoViewIfNeeded();
  const before = await lines();
  expect(before.slice(0, 3)).toEqual(['doctor 66/66 ✓', 'voice round trip 0.5 s', 'RUNNING LOCALLY · 0 FAIL']);
  await expect.poll(lines, { timeout: 4000 }).not.toEqual(before);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500); // let a slide that was under way finish
  const parked = await lines();
  await page.waitForTimeout(3500);
  expect(await lines()).toEqual(parked);
});

test('no console errors while the alive layer runs', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => { (window as unknown as { __aliveSpeed: number }).__aliveSpeed = 10; });
  await page.goto('./');
  await introOver(page);
  await page.mouse.move(400, 300, { steps: 5 });
  await page.locator('.hero [data-pick="zara"]').click();
  await page.waitForTimeout(1500);
  await page.locator('.hero [data-pick="zara"]').click();
  await page.locator('#everything').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator('.lap').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});
