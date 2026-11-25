import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-320',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 320, height: 640 },
      },
    },
    {
      name: 'chromium-1280',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'webkit-375',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],
});
