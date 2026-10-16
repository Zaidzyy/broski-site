// Lighthouse (desktop + mobile) against the preview build. Needs `npm run preview` running.
// CHROME_PATH can point at an existing Chromium. Writes .lighthouse/*.json and prints the scores.
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { mkdirSync, writeFileSync } from 'node:fs';

const URL = process.env.SITE || 'http://localhost:4173/broski-site/';
mkdirSync('.lighthouse', { recursive: true });
const rows = {};
for (const formFactor of ['desktop', 'mobile']) {
  const chrome = await chromeLauncher.launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ['--headless=new', '--no-first-run'] });
  try {
    const config = formFactor === 'desktop'
      ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false }, throttlingMethod: 'simulate', throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } }
      : { extends: 'lighthouse:default' };
    const r = await lighthouse(URL, { port: chrome.port, output: 'json', logLevel: 'error' }, config);
    writeFileSync(`.lighthouse/${formFactor}.json`, r.report);
    const c = r.lhr.categories;
    rows[formFactor] = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(v.score * 100)]));
    const fails = Object.values(r.lhr.audits).filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable');
    rows[formFactor].below90 = fails.map((a) => `${a.id}(${a.displayValue || a.score})`).join(', ');
  } finally {
    await chrome.kill();
  }
}
console.log(JSON.stringify(rows, null, 2));
writeFileSync('.lighthouse/summary.json', JSON.stringify(rows, null, 2));
