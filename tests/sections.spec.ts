import { test, expect } from '@playwright/test';

test('03: Learn is open first; tabs work by click and by keyboard', async ({ page }) => {
  await page.goto('./');
  const tab = (name: string) => page.getByRole('tab', { name: new RegExp(`^${name}`, 'i') });
  await expect(tab('Learn')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-learn')).toBeVisible();
  await expect(page.locator('#panel-learn .tile')).toHaveCount(6);
  await expect(page.locator('.mark.is-on')).toHaveCount(6);
  await expect(page.locator('[data-ring-g]')).toHaveText('Learn');

  await tab('Track').click();
  await expect(tab('Track')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-track')).toBeVisible();
  await expect(page.locator('#panel-learn')).toBeHidden();
  await expect(page.locator('#panel-track .tile').first()).toContainText('Habits with scars');

  await tab('Track').focus();
  await page.keyboard.press('ArrowRight');
  await expect(tab('Train')).toBeFocused();
  await expect(tab('Train')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(tab('Reach')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(tab('Track')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tab('Reach')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(tab('Track')).toHaveAttribute('aria-selected', 'true');
  // only the selected tab is in the tab order
  await expect(page.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
  // all 36 features are in the page
  await expect(page.locator('.bento .tile')).toHaveCount(36);
});

test('04: the gate: Yes, Try again, No', async ({ page }) => {
  await page.goto('./');
  const row = page.locator('.gate__row--send');
  const label = page.locator('[data-gate-label]');
  await row.scrollIntoViewIfNeeded();
  await expect(label).toHaveText('WAITING FOR YOUR YES');

  await page.locator('[data-gate-yes]').click();
  await expect(row).toHaveAttribute('data-gate', 'yes');
  await expect(label).toHaveText('✓ SENT AFTER YOUR YES');
  await expect(page.locator('[data-gate-again]')).toBeFocused();
  await expect.poll(() => page.locator('.gate__bar').evaluate((n) => getComputedStyle(n).opacity), { timeout: 2000 }).toBe('0');

  await page.keyboard.press('Enter'); // Try again, by keyboard
  await expect(row).toHaveAttribute('data-gate', 'wait');
  await expect(page.locator('[data-gate-yes]')).toBeFocused();

  await page.locator('[data-gate-no]').click();
  await expect(label).toHaveText('NOT SENT');
  await page.locator('[data-gate-again]').click();
  await expect(label).toHaveText('WAITING FOR YOUR YES');
});

test('film links show "coming soon" and go nowhere', async ({ page }) => {
  await page.goto('./');
  const url = page.url();
  await page.locator('.hero a[data-soon]').click();
  await expect(page.locator('[data-toast]')).toHaveText('The film is coming soon');
  expect(page.url()).toBe(url);
});

test('keyboard: the skip link and the hero chooser work without a mouse', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.locator('.hero [data-pick="bro"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.hero')).toHaveAttribute('data-who', 'bro');
  await page.keyboard.press('Space');
  await expect(page.locator('.hero')).toHaveAttribute('data-who', 'both');
});
