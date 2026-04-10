import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  use: {
    baseURL: 'http://localhost:8000',
    video: 'on',
  },
  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome']}},
  ],
});
