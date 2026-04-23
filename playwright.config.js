// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * Tests serve the static site from the repo root via Playwright's
 * built-in webServer, then exercise the launcher and each game at
 * iPhone + iPad viewports. Chromium (with WebKit User-Agent) is
 * sufficient to catch layout regressions — real-device verification
 * is still encouraged for touch behavior.
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
  webServer: {
    command: 'npx http-server -p 4173 -c-1 -s .',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
