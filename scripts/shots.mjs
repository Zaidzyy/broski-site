// Screenshots for the report: every section on desktop and phone, and every day scene.
// Needs `npm run preview` running. Usage: node scripts/shots.mjs [outDir]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const URL = process.env.SITE || 'http://localhost:4173/broski-site/';
const OUT = process.argv[2] || 'docs/screens';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });

const settle = (page, ms = 900) => page.waitForTimeout(ms);
async function day(page, prefix) {
  for (let i = 0; i < 12; i++) {
    await page.evaluate((k) => { const d = window.__day; window.scrollTo(0, d.yFor(d.sceneT(k))); }, i);
    await settle(page, 2600); // scrub + the scene's entry animation
    await page.screenshot({ path: `${OUT}/${prefix}-day-${String(i + 1).padStart(2, '0')}.png` });
  }
  await page.evaluate(() => { const d = window.__day; window.scrollTo(0, d.yFor(d.UNITS)); });
  await settle(page, 1500);
  await page.screenshot({ path: `${OUT}/${prefix}-day-13-end.png` });
}
async function sections(page, prefix) {
  for (const [name, sel] of [['03-rest', '#everything'], ['04-hood', '#hood'], ['05-yours', '#yours'], ['06-footer', '.foot']]) {
    await page.locator(sel).scrollIntoViewIfNeeded();
    await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'start' }), sel);
    await settle(page, 1200);
    await page.screenshot({ path: `${OUT}/${prefix}-${name}.png` });
  }
}

try {
  for (const [prefix, opts] of [
    ['desktop', { viewport: { width: 1440, height: 900 } }],
    ['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    await page.goto(URL);
    await settle(page, 3200);
    await page.screenshot({ path: `${OUT}/${prefix}-01-hero.png` });
    await page.locator('.hero [data-pick="zara"]').click();
    await settle(page, 1300);
    await page.screenshot({ path: `${OUT}/${prefix}-01-hero-zara.png` });
    await page.locator('.hero [data-pick="bro"]').click();
    await settle(page, 1300);
    await page.screenshot({ path: `${OUT}/${prefix}-01-hero-bro.png` });
    await page.locator('.hero [data-pick="bro"]').click();
    await page.evaluate(() => document.querySelector('.day__intro').scrollIntoView());
    await settle(page);
    await page.screenshot({ path: `${OUT}/${prefix}-02-day-intro.png` });
    await day(page, prefix);
    await sections(page, prefix);
    await ctx.close();
  }
  // the still day: only without JavaScript (and in windows under 520 px tall)
  const nojs = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const p = await nojs.newPage();
  await p.goto(URL + '#s1115'); // page scripts are off, so the anchor does the scrolling
  await settle(p);
  await p.screenshot({ path: `${OUT}/no-js-day.png` });
  await nojs.close();
} finally {
  await browser.close();
}
console.log('screens in', OUT);
