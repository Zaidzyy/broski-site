// Records the README's day GIF: the desktop day scrolling through all 12 scenes and the ending.
// Needs `npm run preview` running and ffmpeg on the PATH. Usage: node scripts/daygif.mjs
// The page clock is driven by hand, so every frame is exactly 1/FPS apart however slow the screenshots are.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.SITE || 'http://localhost:4173/broski-site/';
const OUT = 'docs/media/day.gif';
const FPS = 12;
const MOVE = 0.3; // seconds from one scene to the next
const HOLD = 0.5; // seconds on each scene
const END_HOLD = 1.4; // seconds on the 72
const frames = join(tmpdir(), 'broski-daygif');
rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });
mkdirSync('docs/media', { recursive: true });

const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.clock.install();
  await page.goto(URL);
  await page.evaluate(() => document.fonts.ready);
  const yFor = (t) => page.evaluate((k) => window.__day.yFor(k), t);
  const sceneT = (i) => page.evaluate((k) => window.__day.sceneT(k), i);
  const UNITS = await page.evaluate(() => window.__day.UNITS);

  // the path of the clock: hold on each scene, ease to the next, then the ending
  const stops = [];
  for (let i = 0; i < 12; i++) stops.push(await sceneT(i));
  stops.push(UNITS);
  const keys = []; // [seconds, t]
  let s = 0;
  for (let i = 0; i < stops.length; i++) {
    keys.push([s, stops[i]]);
    s += i === stops.length - 1 ? END_HOLD : HOLD;
    keys.push([s, stops[i]]);
    s += MOVE;
  }
  const total = keys[keys.length - 1][0];
  const tAt = (sec) => {
    for (let k = 1; k < keys.length; k++) {
      const [s0, t0] = keys[k - 1], [s1, t1] = keys[k];
      if (sec <= s1) return s1 === s0 ? t1 : t0 + (t1 - t0) * ease((sec - s0) / (s1 - s0));
    }
    return keys[keys.length - 1][1];
  };

  // settle on the first scene with its widgets in, then record
  await page.evaluate((y) => window.scrollTo(0, y), await yFor(stops[0]));
  await page.clock.runFor(2500);
  const n = Math.round(total * FPS);
  for (let f = 0; f < n; f++) {
    await page.evaluate((y) => window.scrollTo(0, y), await yFor(tAt(f / FPS)));
    await page.clock.runFor(1000 / FPS);
    await page.screenshot({ path: join(frames, `f${String(f).padStart(4, '0')}.png`) });
  }
  console.log(`${n} frames, ${total.toFixed(1)} s`);
} finally {
  await browser.close();
}

const input = join(frames, 'f%04d.png');
const scale = 'scale=960:-1:flags=lanczos';
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', input, '-vf', `${scale},palettegen=max_colors=128:stats_mode=diff`, join(frames, 'palette.png')]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', input, '-i', join(frames, 'palette.png'),
  '-lavfi', `${scale}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, '-loop', '0', OUT]);
rmSync(frames, { recursive: true, force: true });
console.log(`${OUT}: ${(statSync(OUT).size / 1e6).toFixed(2)} MB`);
