// Renders the OG image (1200×630) from the live hero. Needs `npm run preview` running.
import { chromium } from '@playwright/test';

const URL = process.env.SITE || 'http://localhost:4173/broski-site/';
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
  await page.goto(URL);
  // a fixed 630 px hero, no chooser chrome: just the word, the slash and both faces
  await page.addStyleTag({ content: '.hero{--hh:630px;height:630px}.chooser,.hero__head,.fig,.skip{display:none!important}.word{top:70px}' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.locator('.hero').screenshot({ path: 'public/og.png' });
} finally {
  await browser.close();
}
console.log('public/og.png written');
