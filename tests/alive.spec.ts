// The "alive" pass: hero breathing, parallax, blinks and glances; the 03 wandering tick; the 04 live log.
import { test, expect, type Page } from '@playwright/test';

const introOver = (page: Page) => expect(page.locator('.hero')).toHaveClass(/is-alive/, { timeout: 5000 });

test('breathing starts from rest after the intro and freezes off screen and in a hidden tab', async ({ page }) => {
  const breaths = () => page.locator('.breath').evaluateAll((ns) => ns.map((n) => (n as HTMLElement).style.transform));
  await page.goto('./');
  await expect(page.locator('.hero')).not.toHaveClass(/is-alive/); // nothing moves during the intro
  expect(await breaths()).toEqual(['', '']);
  await introOver(page);
  // each face starts breathing after its own short wait, from rest
  await expect.poll(async () => (await breaths()).every((t) => t !== ''), { timeout: 6000 }).toBe(true);
  const [bro, zara] = await breaths();
  expect(bro).not.toBe(zara); // out of sync

  const frozen = async () => { const a = await breaths(); await page.waitForTimeout(800); return JSON.stringify(a) === JSON.stringify(await breaths()); };
  await page.locator('.foot').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  expect(await frozen()).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  expect(await frozen()).toBe(false);

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(300);
  expect(await frozen()).toBe(true);
});

for (const [name, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
] as const) {
  test(`${name}: the intro hands over to the alive layer without a jump`, async ({ browser }) => {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    if (name === 'desktop') await page.mouse.move(1300, 120); // a pointer already on the page must not snap the faces
    await page.goto('./');
    // every frame from 2.0 s to 4.5 s after navigation (the intro ends at ~2.8 s): where each face and the letters are
    const samples = await page.evaluate(() => new Promise<number[][]>((done) => {
      const out: number[][] = [];
      const els = [...document.querySelectorAll('.pic__main img'), document.querySelector('.word--solid')!];
      const tick = (now: number) => {
        if (now >= 2000) out.push(els.flatMap((e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width]; }));
        if (now < 4500) requestAnimationFrame(tick); else done(out);
      };
      requestAnimationFrame(tick);
    }));
    await expect(page.locator('.hero')).toHaveClass(/is-alive/); // the handoff happened inside the window
    expect(samples.length).toBeGreaterThan(60);
    let move = 0, scale = 0;
    for (let f = 1; f < samples.length; f++) {
      for (let e = 0; e < 3; e++) {
        const [l0, t0, w0] = samples[f - 1].slice(e * 3, e * 3 + 3);
        const [l1, t1, w1] = samples[f].slice(e * 3, e * 3 + 3);
        move = Math.max(move, Math.abs(l1 - l0), Math.abs(t1 - t0));
        if (e < 2) scale = Math.max(scale, Math.abs(w1 / w0 - 1));
      }
    }
    expect(move).toBeLessThan(0.5);
    expect(scale).toBeLessThan(0.002);
    await ctx.close();
  });
}

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
  expect(await page.locator('.face--bro .pic').evaluate((n) => (n as HTMLElement).style.translate)).toBe(''); // no snap before a move
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
  await phone.mouse.move(10, 10, { steps: 4 });
  // the drift: sideways only, within ±4 px, whatever the pointer does
  const drift = () => phone.locator('.face--bro .pic').evaluate((n) => (n as HTMLElement).style.translate);
  await expect.poll(drift, { timeout: 4000 }).not.toBe('');
  const [x, y] = (await drift()).split(' ').map(parseFloat);
  expect(Math.abs(x)).toBeLessThanOrEqual(4);
  expect(y || 0).toBe(0);
  await ctx.close();
});

test('03: the tick wanders while on screen and pauses only over the words, the cards or keyboard focus', async ({ page }) => {
  await page.goto('./');
  await introOver(page);
  await page.locator('#everything').scrollIntoViewIfNeeded();
  const wandering = () => page.evaluate(() => [...document.querySelectorAll('.fring .mark')].findIndex((m) => m.classList.contains('is-wander')));
  const keepsMoving = async () => { const a = await wandering(); await page.waitForTimeout(1500); return (await wandering()) !== a; };
  await expect.poll(wandering, { timeout: 3000 }).toBeGreaterThanOrEqual(0);

  // moving the mouse elsewhere in the section (the heading, the ring) doesn't pause it
  await page.locator('#rest-h').hover();
  await page.mouse.move(300, 300, { steps: 5 });
  await page.locator('.fring__c').hover();
  expect(await keepsMoving()).toBe(true);
  expect(await page.locator('.fring .mark.is-wander.is-on').count()).toBe(0); // never on the chosen group's arc

  // over a card: it stops where it is and stays lit
  await page.locator('#panel-learn .tile').nth(1).hover();
  await page.waitForTimeout(300);
  const stopped = await wandering();
  expect(stopped).toBeGreaterThanOrEqual(0);
  expect(await keepsMoving()).toBe(false);
  // leaving the cards: it walks on from the same tick ~0.6 s later
  await page.locator('#rest-h').hover();
  await expect.poll(wandering, { timeout: 1500 }).not.toBe(stopped);
  const next = await page.evaluate((from) => {
    const ms = [...document.querySelectorAll('.fring .mark')];
    let k = from;
    do k = (k + 1) % ms.length; while (ms[k].classList.contains('is-on'));
    return k;
  }, stopped);
  expect(await wandering()).toBe(next);

  // over a tab word: paused too
  await page.getByRole('tab', { name: /^Brain/ }).hover();
  await page.waitForTimeout(300);
  expect(await keepsMoving()).toBe(false);
  await page.locator('#rest-h').hover();
  expect(await keepsMoving()).toBe(true);

  // keyboard focus in the tabs: paused until focus leaves
  await page.getByRole('tab', { name: /^Learn/ }).focus();
  await page.waitForTimeout(300);
  expect(await keepsMoving()).toBe(false);
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  expect(await keepsMoving()).toBe(true);
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
