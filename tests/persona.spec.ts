import { test, expect, type Page } from '@playwright/test';

const STEEL = 'rgb(142, 164, 186)';
const ROSE = 'rgb(216, 138, 156)';
const style = (page: Page, sel: string, prop: 'color' | 'backgroundColor') =>
  page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s)!)[p as 'color'], [sel, prop]);

test('Bro / Zara recolours the hero and the day accent, and a second click goes back to both', async ({ page }) => {
  await page.goto('./');
  const hero = page.locator('.hero');
  await expect(hero).toHaveAttribute('data-who', 'both');

  await page.locator('.hero [data-pick="bro"]').click();
  await expect(hero).toHaveAttribute('data-who', 'bro');
  await expect(page.locator('[data-status]')).toHaveText('Bro is on');
  await expect(page.locator('[data-question]')).toHaveText('Discipline it is.');
  await expect.poll(() => style(page, '.word--solid', 'color'), { timeout: 3000 }).toBe(STEEL);
  await expect.poll(() => style(page, '.day__prog span', 'backgroundColor')).toBe(STEEL);
  await expect(page.locator('#day-h [data-who]')).toHaveText('Bro');

  await page.locator('.hero [data-pick="zara"]').click();
  await expect(hero).toHaveAttribute('data-who', 'zara');
  await expect.poll(() => style(page, '.word--solid', 'color'), { timeout: 3000 }).toBe(ROSE);
  await expect.poll(() => style(page, '.day__prog span', 'backgroundColor')).toBe(ROSE);
  await expect(page.locator('[data-hint-t]')).toHaveText('NOW SCROLL · LIVE ONE DAY WITH ZARA');

  await page.locator('.hero [data-pick="zara"]').click();
  await expect(hero).toHaveAttribute('data-who', 'both');
  await expect(page.locator('[data-question]')).toHaveText('Who do you want today?');
});

test('the switch in the day bar changes the persona everywhere', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => window.scrollTo(0, document.querySelector<HTMLElement>('.day__track')!.offsetTop + 50));
  await page.locator('[data-persona-btn="bro"]').click();
  await expect(page.locator('.hero')).toHaveAttribute('data-who', 'bro');
  await expect(page.locator('[data-persona-btn="bro"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => style(page, '.day__prog span', 'backgroundColor')).toBe(STEEL);
  await expect(page.locator('[data-line="s0400"]').first()).toContainText('Move.');
});

test('hover peeks on a pointer device', async ({ page }) => {
  await page.goto('./');
  await page.waitForTimeout(2600); // let the intro finish
  await page.locator('.hero [data-pick="bro"]').hover();
  await expect(page.locator('.hero')).toHaveAttribute('data-peek', 'bro');
  await expect(page.locator('[data-question]')).toHaveText('Strict. Steady. Honest.');
  await page.mouse.move(5, 300);
  await expect(page.locator('.hero')).toHaveAttribute('data-peek', '');
});
