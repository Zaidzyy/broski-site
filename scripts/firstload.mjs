// Measures the hero intro on a cold first visit: a fresh browser context (empty cache), Lighthouse's slow-4G
// network (150 ms RTT, 1.6 Mbps down) and a 4x CPU slowdown. Needs `npm run preview` running.
// Usage: node scripts/firstload.mjs [runs=3] [clip.mp4]
// For each run: when the intro started, whether the font and both hero images were ready by then,
// dropped frames and long tasks during the intro (2.9 s from the letters' first frame).
// With a clip path, one more run is recorded (Chrome's screencast, real timing) and encoded with ffmpeg.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.SITE || 'http://localhost:4173/broski-site/';
const RUNS = Number(process.argv[2] || 3);
const CLIP = process.argv[3];
const INTRO_MS = 2900;

// injected before the page's own scripts: frame times, long tasks, and when each hero image became decodable
const PROBE = () => {
  const w = window;
  w.__frames = [];
  w.__long = [];
  const tick = (t) => { w.__frames.push(t); if (t < 9000) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => w.__long.push([e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true }); } catch {}
  w.__imgReady = {};
  document.addEventListener('DOMContentLoaded', () => {
    for (const img of document.querySelectorAll('.pic__main img')) {
      const key = img.closest('.face').classList.contains('face--bro') ? 'bro' : 'zara';
      img.decode().then(() => { w.__imgReady[key] = performance.now(); }, () => {});
    }
  });
  // fonts.ready can resolve before Anton is even requested, so watch Anton's own face (without loading it)
  document.addEventListener('DOMContentLoaded', () => {
    const anton = [...document.fonts].find((f) => f.family.replace(/"/g, '') === 'Anton');
    anton?.loaded.then(() => { w.__fontReady = performance.now(); }, () => {});
  });
};

async function cold(browser, record) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(PROBE);
  const frames = [];
  if (record) {
    cdp.on('Page.screencastFrame', async (f) => { frames.push({ t: f.metadata.timestamp, data: f.data }); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {} });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1440, maxHeight: 900, everyNthFrame: 1 });
  }
  const t0 = Date.now() / 1000;
  await page.goto(URL, { waitUntil: 'commit' });
  await page.waitForFunction(() => performance.now() > 8000, null, { timeout: 30000, polling: 250 });
  const m = await page.evaluate((introMs) => {
    const w = window;
    // the intro starts when the letters' rise really starts running
    const rise = document.getAnimations().filter((a) => a.animationName === 'rise' && a.startTime !== null);
    const start = rise.length ? Math.min(...rise.map((a) => a.startTime)) : NaN;
    const end = start + introMs;
    const fr = w.__frames.filter((t) => t >= start && t <= end);
    let dropped = 0, worst = 0;
    for (let i = 1; i < fr.length; i++) {
      const gap = fr[i] - fr[i - 1];
      worst = Math.max(worst, gap);
      if (gap > 25) dropped += Math.round(gap / 16.67) - 1;
    }
    const long = w.__long.filter(([s, d]) => s + d > start && s < end);
    return {
      firstPaint: Math.round(performance.getEntriesByName('first-paint')[0]?.startTime ?? NaN),
      fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? NaN),
      introStart: Math.round(start),
      fontReady: Math.round(w.__fontReady ?? NaN),
      broImg: Math.round(w.__imgReady.bro ?? NaN), zaraImg: Math.round(w.__imgReady.zara ?? NaN),
      dropped, worstFrame: Math.round(worst), longTasks: long.length, longMs: Math.round(long.reduce((n, [, d]) => n + d, 0)),
      why: document.querySelector('.hero')?.dataset.introWhy ?? '-',
    };
  }, INTRO_MS);
  if (record) await cdp.send('Page.stopScreencast');
  await ctx.close();
  return { m, frames, t0 };
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
try {
  const rows = [];
  for (let i = 0; i < RUNS; i++) rows.push((await cold(browser, false)).m);
  console.table(rows);
  if (CLIP) {
    const { frames, t0 } = await cold(browser, true);
    const dir = join(tmpdir(), 'broski-firstload');
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const end = t0 + 6.5;
    const kept = frames.filter((f) => f.t <= end);
    let list = '';
    kept.forEach((f, i) => {
      const name = `f${String(i).padStart(4, '0')}.jpg`;
      writeFileSync(join(dir, name), Buffer.from(f.data, 'base64'));
      list += `file '${name}'\nduration ${Math.max(0.001, (kept[i + 1]?.t ?? end) - f.t).toFixed(4)}\n`;
    });
    list += `file 'f${String(kept.length - 1).padStart(4, '0')}.jpg'\n`;
    writeFileSync(join(dir, 'list.txt'), list);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'), '-vf', 'fps=30,scale=1280:-2:flags=lanczos', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', CLIP]);
    rmSync(dir, { recursive: true, force: true });
    console.log(`clip: ${CLIP} (${kept.length} frames, from navigation to 6.5 s)`);
  }
} finally {
  await browser.close();
}
