/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './test',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 20 * 1000,
  expect: { timeout: 5000 },
  reporter: [['list']],
  use: {
    browserName: 'chromium',
    ...require('@playwright/test').devices['Desktop Chrome'],
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
};

module.exports = config;
