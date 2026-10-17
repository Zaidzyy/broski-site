import { expect, type Page } from '@playwright/test';

export interface DayHook { yFor(t: number): number; sceneT(i: number): number; UNITS: number; t(): number; active(): number }

export const TIMES = ['04:00', '07:42', '08:30', '10:00', '11:15', '12:30', '14:03', '15:20', '16:40', '19:10', '21:30', '23:00'];
export const IDS = TIMES.map((t) => 's' + t.replace(':', ''));

const hook = (page: Page) => page.evaluate(() => {
  const d = (window as unknown as { __day: DayHook }).__day;
  return { t: d.t(), active: d.active() };
});

/** The day is set up after the intro or at the first scroll (src/main.ts): scroll a pixel and wait for it. */
export async function dayReady(page: Page) {
  await page.evaluate(() => window.scrollTo(0, window.scrollY + 1));
  await page.waitForFunction(() => (window as unknown as { __day?: DayHook }).__day !== undefined || document.querySelector('.day.is-static-js') !== null);
}

/** Jumps straight to scene i's hold and waits for the scrubbed clock to settle. */
export async function gotoScene(page: Page, i: number) {
  await dayReady(page);
  await page.evaluate((k) => {
    const d = (window as unknown as { __day: DayHook }).__day;
    window.scrollTo(0, d.yFor(d.sceneT(k)));
  }, i);
  const target = await page.evaluate((k) => (window as unknown as { __day: DayHook }).__day.sceneT(k), i);
  await expect.poll(async () => {
    const h = await hook(page);
    return h.active === i && Math.abs(h.t - target) < 0.03;
  }, { timeout: 6000 }).toBe(true);
}

export const activeScene = async (page: Page) => (await hook(page)).active;

/** The dial digits a viewer actually sees: the visible ink layer's fully shown time. */
export async function visibleDigits(page: Page) {
  return page.evaluate(() => {
    const layers = [...document.querySelectorAll<HTMLElement>('.ctr__ink')].filter((l) => Number(getComputedStyle(l).opacity) > 0.5);
    const shown = layers.flatMap((l) => [...l.querySelectorAll<HTMLElement>('.ctr__t')]).filter((n) => Number(getComputedStyle(n).opacity) > 0.9);
    return shown.map((n) => n.textContent);
  });
}

export async function waitForSceneOpaque(page: Page, id: string) {
  await expect.poll(() => page.evaluate((x) => Number(getComputedStyle(document.getElementById(x)!).opacity), id), { timeout: 4000 }).toBeGreaterThan(0.95);
}

export const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
