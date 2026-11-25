import { defineConfig, devices } from '@playwright/test';

/**
 * Captures the responsive screenshots in docs/screenshots/responsive. Run by
 * hand with `npm run screenshots`; CI runs `npm test`, which never reads this
 * file. Chromium only: WebKit on Linux drops the Secure sign-in cookie on
 * http://localhost.
 */
export default defineConfig({
  testDir: './screenshots',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  projects: [
    {
      name: 'phone-375',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } },
    },
    {
      name: 'tablet-768',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'desktop-1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
});
