import { defineConfig } from '@playwright/test';

// PW_CHROMIUM lets a local run use an already-downloaded Chromium (no browser download needed).
const executablePath = process.env.PW_CHROMIUM || undefined;
const base = process.env.BASE_PATH || '/broski-site/';

export default defineConfig({
  testDir: 'tests',
  workers: 1, // one browser at a time: this runs on a shared laptop
  timeout: 90_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:4173${base}`,
    viewport: { width: 1440, height: 900 },
    launchOptions: { executablePath },
  },
  webServer: {
    command: 'npm run preview',
    url: `http://localhost:4173${base}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
