// 03: hover to peek, click to choose (like the hero). Mouse with a fine pointer only; touch stays tap-only.
import { test, expect, type Page } from '@playwright/test';

const tab = (page: Page, name: string) => page.getByRole('tab', { name: new RegExp(`^${name}`, 'i') });
const ringG = (page: Page) => page.locator('[data-ring-g]');
const litGroups = (page: Page) => page.locator('.fring .mark.is-on').evaluateAll((ms) => [...new Set(ms.map((m) => (m as HTMLElement).dataset.g))]);

test('hovering a word previews its group; leaving the row returns to the selection', async ({ page }) => {
  await page.goto('./');
  await page.locator('#everything').scrollIntoViewIfNeeded();
  await expect(page.locator('.tabs__hint')).toBeVisible();
  await expect(page.locator('.tabs__hint')).toHaveText('HOVER TO PEEK · CLICK TO CHOOSE');

  await tab(page, 'Track').hover();
  await expect(ringG(page)).toHaveText('Track');
  await expect(page.locator('#panel-track')).toBeVisible();
  await expect(page.locator('#panel-learn')).toBeHidden();
  expect(await litGroups(page)).toEqual(['0']);
  await expect(tab(page, 'Track')).toHaveClass(/is-peek/);
  await expect.poll(() => tab(page, 'Track').evaluate((n) => getComputedStyle(n).color)).toBe('rgb(216, 138, 156)');
  // a peek doesn't select
  await expect(tab(page, 'Learn')).toHaveAttribute('aria-selected', 'true');

  await page.locator('.fring__c').hover(); // off the row
  await expect(ringG(page)).toHaveText('Learn');
  await expect(page.locator('#panel-learn')).toBeVisible();
  await expect(page.locator('#panel-track')).toBeHidden();
  await expect(tab(page, 'Track')).not.toHaveClass(/is-peek/);

  // click locks the choice; leaving keeps it
  await tab(page, 'Brain').click();
  await page.locator('.fring__c').hover();
  await expect(ringG(page)).toHaveText('Brain');
  await expect(page.locator('#panel-brain')).toBeVisible();
  await expect(tab(page, 'Brain')).toHaveAttribute('aria-selected', 'true');
});

test('a quick pass over the words neither stacks fades nor switches before the intent delay', async ({ page }) => {
  await page.goto('./');
  await page.locator('#everything').scrollIntoViewIfNeeded();
  const boxes = await Promise.all(['Track', 'Train', 'Work', 'Learn', 'Brain', 'Reach'].map((n) => tab(page, n).boundingBox()));
  const y = boxes[0]!.y + boxes[0]!.height / 2;
  // sweep the whole row in about 50 ms, then leave: nothing should have changed
  await page.mouse.move(boxes[0]!.x + 5, y);
  await page.mouse.move(boxes[5]!.x + 20, y, { steps: 3 });
  await page.mouse.move(boxes[5]!.x + 20, y + 300);
  await page.waitForTimeout(400);
  await expect(ringG(page)).toHaveText('Learn');
  await expect(page.locator('.bento:visible')).toHaveCount(1);

  // a slower sweep ending on Reach: only Reach is left showing, fully opaque
  for (const b of boxes) { await page.mouse.move(b!.x + b!.width / 2, y); await page.waitForTimeout(150); }
  await page.waitForTimeout(500);
  await expect(ringG(page)).toHaveText('Reach');
  await expect(page.locator('.bento:visible')).toHaveCount(1);
  await expect(page.locator('#panel-reach')).toBeVisible();
  expect(await page.locator('#panel-reach').evaluate((n) => getComputedStyle(n).opacity)).toBe('1');
});

test('touch: no hover preview, no hint; a tap still selects', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('./');
  expect(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(false);
  await page.locator('#everything').scrollIntoViewIfNeeded();
  await expect(page.locator('.tabs__hint')).toBeHidden();
  await tab(page, 'Track').hover();
  await page.waitForTimeout(400);
  await expect(ringG(page)).toHaveText('Learn');
  await expect(page.locator('#panel-learn')).toBeVisible();
  await tab(page, 'Track').tap();
  await expect(ringG(page)).toHaveText('Track');
  await expect(tab(page, 'Track')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-track')).toBeVisible();
  await ctx.close();
});

test('keyboard: focus and arrows still select, with no peek state', async ({ page }) => {
  await page.goto('./');
  await tab(page, 'Learn').focus();
  await page.keyboard.press('ArrowRight');
  await expect(tab(page, 'Brain')).toBeFocused();
  await expect(tab(page, 'Brain')).toHaveAttribute('aria-selected', 'true');
  await expect(ringG(page)).toHaveText('Brain');
  await expect(page.locator('#panel-brain')).toBeVisible();
  await expect(page.locator('#panel-learn')).toBeHidden();
  await expect(page.locator('.tabs')).not.toHaveClass(/is-peeking/);
  await expect(page.locator('.tab.is-peek')).toHaveCount(0);
});
