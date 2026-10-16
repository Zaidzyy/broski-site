import { test, expect, type Page, type Request } from '@playwright/test';

const card = (page: Page) => page.locator('[data-vote]');

async function trackPosts(page: Page) {
  const posts: Request[] = [];
  page.on('request', (r) => { if (r.method() !== 'GET') posts.push(r); });
  return posts;
}

test('Count me in stays disabled until a pick', async ({ page }) => {
  await page.goto('./');
  const send = page.getByRole('button', { name: 'Count me in' });
  await send.scrollIntoViewIfNeeded();
  await expect(send).toBeDisabled();
  await page.getByLabel('Just the trading coach').check({ force: true });
  await expect(send).toBeEnabled();
});

test('with an empty endpoint nothing is sent, and the thank-you shows', async ({ page }) => {
  const posts = await trackPosts(page);
  await page.goto('./');
  await page.getByLabel('The whole thing').check({ force: true });
  await card(page).locator('input[type="email"]').fill('someone@example.com');
  await page.getByRole('button', { name: 'Count me in' }).click();
  await expect(page.locator('[data-vote-done]')).toBeVisible();
  await expect(page.locator('[data-vote-picked]')).toHaveText('The whole thing');
  await expect(page.locator('[data-vote-thanks]')).toBeFocused();
  await page.waitForTimeout(500);
  expect(posts).toEqual([]);

  await page.getByRole('button', { name: /change my vote/i }).click();
  await expect(card(page)).toBeVisible();
  await expect(page.getByLabel('The whole thing')).toBeChecked();
});

for (const email of ['', 'judge@example.com']) {
  test(`with a mocked endpoint the payload is exactly {choice${email ? ', email' : ''}}`, async ({ page }) => {
    let body: unknown = null;
    let headers: Record<string, string> = {};
    await page.route('**/__vote-mock', async (route) => {
      body = route.request().postDataJSON();
      headers = route.request().headers();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.addInitScript(() => { (window as unknown as { __voteEndpoint: string }).__voteEndpoint = '/__vote-mock'; });
    await page.goto('./');
    await page.locator('.hero [data-pick="bro"]').click(); // the persona must never be sent
    await page.getByLabel('Just the voice + bubble').check({ force: true });
    if (email) await card(page).locator('input[type="email"]').fill(email);
    await page.getByRole('button', { name: 'Count me in' }).click();
    await expect(page.locator('[data-vote-done]')).toBeVisible();
    expect(body).toEqual(email ? { choice: 'voice-bubble', email } : { choice: 'voice-bubble' });
    expect(headers['cookie']).toBeUndefined();
  });
}

test('a bad email is caught before anything is sent', async ({ page }) => {
  const posts = await trackPosts(page);
  await page.addInitScript(() => { (window as unknown as { __voteEndpoint: string }).__voteEndpoint = '/__vote-mock'; });
  await page.goto('./');
  await page.getByLabel('The whole thing').check({ force: true });
  await card(page).locator('input[type="email"]').fill('not-an-email');
  await page.getByRole('button', { name: 'Count me in' }).click();
  await expect(page.locator('[data-vote-err]')).toBeVisible();
  expect(posts).toEqual([]);
});
