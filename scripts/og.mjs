// Renders the OG image (1200×630) from the live hero. Needs `npm run preview` running.
import { chromium } from '@playwright/test';

const URL = process.env.SITE || 'http://localhost:4173/broski-site/';
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(URL);
  // a fixed 630 px hero, no chooser chrome: just the word, the slash, both faces and the lockup in the header's corner
  await page.addStyleTag({ content: '.hero{--hh:630px;height:630px}.chooser,.fig,.skip,.hero__vol,.hero__status,.hero__links{display:none!important}.hero__head{border:0;padding:18px 36px}.lockup{height:40px}.word{top:70px}' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3400); // the intro (letters, slash, faces) has finished
  await page.locator('.hero').screenshot({ path: 'public/og.png' });
} finally {
  await browser.close();
}
console.log('public/og.png written');
