// 05 · The vote: one POST of exactly { choice, email?, _gotcha } to the Formspree endpoint, only on "Count me in".
// Every test intercepts https://formspree.io, so the suite never reaches the real form.
import { test, expect, type Page, type Request, type Route } from '@playwright/test';

const ENDPOINT = 'https://formspree.io/f/mzedopnj';
const card = (page: Page) => page.locator('[data-vote]');

/** Intercepts the endpoint; `reply` decides the answer. Returns every request that reached it. */
async function mockForm(page: Page, reply: (route: Route) => Promise<void>) {
  const hits: Request[] = [];
  await page.route('https://formspree.io/**', async (route) => { hits.push(route.request()); await reply(route); });
  return hits;
}
const ok = (route: Route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });

test('Count me in stays disabled until a pick', async ({ page }) => {
  await mockForm(page, ok);
  await page.goto('./');
  const send = page.getByRole('button', { name: 'Count me in' });
  await send.scrollIntoViewIfNeeded();
  await expect(send).toBeDisabled();
  await page.getByLabel('Just the trading coach').check({ force: true });
  await expect(send).toBeEnabled();
});

test('the honeypot is there, empty, off screen, out of the tab order and hidden from screen readers', async ({ page }) => {
  await page.goto('./');
  const hp = card(page).locator('input[name="_gotcha"]');
  await expect(hp).toHaveCount(1);
  await expect(hp).toHaveValue('');
  await expect(hp).toHaveAttribute('tabindex', '-1');
  await expect(hp).toHaveAttribute('autocomplete', 'off');
  await expect(hp).toHaveAttribute('aria-hidden', 'true');
  const box = (await hp.boundingBox())!;
  expect(box.x + box.width).toBeLessThan(0); // off screen
  // tabbing through the form skips it: from the email field the next stop is the button
  await page.getByLabel('The whole thing').check({ force: true });
  await card(page).locator('input[type="email"]').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Count me in' })).toBeFocused();
});

test('nothing is sent at load or while picking; one POST on "Count me in"', async ({ page }) => {
  const hits = await mockForm(page, ok);
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  await page.locator('.hero [data-pick="zara"]').click();
  await page.getByLabel('The whole thing').check({ force: true });
  await card(page).locator('input[type="email"]').fill('someone@example.com');
  await page.waitForTimeout(300);
  expect(hits).toHaveLength(0);
  await page.getByRole('button', { name: 'Count me in' }).click();
  await expect(page.locator('[data-vote-done]')).toBeVisible();
  expect(hits).toHaveLength(1);
  await expect(page.locator('[data-vote-picked]')).toHaveText('The whole thing');
  await expect(page.locator('[data-vote-thanks]')).toBeFocused();

  await page.getByRole('button', { name: /change my vote/i }).click();
  await expect(card(page)).toBeVisible();
  await expect(page.getByLabel('The whole thing')).toBeChecked();
});

for (const email of ['', 'judge@example.com']) {
  test(`the POST is exactly {choice${email ? ', email' : ''}, _gotcha} as JSON, with the right headers`, async ({ page }) => {
    const hits = await mockForm(page, (route) => route.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true}' }));
    await page.goto('./');
    await page.locator('.hero [data-pick="bro"]').click(); // the persona must never be sent
    await page.getByLabel('Just the voice + bubble').check({ force: true });
    if (email) await card(page).locator('input[type="email"]').fill(email);
    await page.getByRole('button', { name: 'Count me in' }).click();
    await expect(page.locator('[data-vote-done]')).toBeVisible(); // any 2xx counts (201 here)
    expect(hits).toHaveLength(1);
    const req = hits[0];
    expect(req.url()).toBe(ENDPOINT);
    expect(req.method()).toBe('POST');
    expect(req.postDataJSON()).toEqual(email ? { choice: 'voice-bubble', email, _gotcha: '' } : { choice: 'voice-bubble', _gotcha: '' });
    const h = req.headers();
    expect(h['content-type']).toBe('application/json');
    expect(h['accept']).toBe('application/json');
    expect(h['cookie']).toBeUndefined();
    expect(h['referer']).toBeUndefined();
  });
}

for (const [name, reply] of [
  ['an error status', (route: Route) => route.fulfill({ status: 422, contentType: 'application/json', body: '{"error":"nope"}' })],
  ['a network failure', (route: Route) => route.abort('failed')],
] as const) {
  test(`${name} shows the failure line, never "Counted", and keeps the pick for a retry`, async ({ page }) => {
    const hits = await mockForm(page, reply);
    await page.goto('./');
    await page.getByLabel('Just the trading coach').check({ force: true });
    const send = page.locator('.vote__send');
    await send.click();
    await expect(page.locator('[data-vote-err]')).toHaveText('Couldn’t send that. Try again in a moment.');
    await expect(page.locator('[data-vote-done]')).toBeHidden();
    await expect(page.getByText('✓ Counted')).toBeHidden();
    await expect(page.getByLabel('Just the trading coach')).toBeChecked();
    await expect(send).toHaveText('Count me in');
    await expect(send).toBeEnabled();
    expect(hits).toHaveLength(1);
    // the retry goes through once the form answers
    await page.unroute('https://formspree.io/**');
    const again = await mockForm(page, ok);
    await send.click();
    await expect(page.locator('[data-vote-done]')).toBeVisible();
    expect(again).toHaveLength(1);
  });
}

test('a bad email is caught before anything is sent', async ({ page }) => {
  const hits = await mockForm(page, ok);
  await page.goto('./');
  await page.getByLabel('The whole thing').check({ force: true });
  await card(page).locator('input[type="email"]').fill('not-an-email');
  await page.getByRole('button', { name: 'Count me in' }).click();
  await expect(page.locator('[data-vote-err]')).toBeVisible();
  await page.waitForTimeout(300);
  expect(hits).toHaveLength(0);
});
