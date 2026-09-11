import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testDir: './tests/browser-unavailable',
  outputDir: 'test-results/playwright-unavailable',
  reporter: [['list'], ['json', { outputFile: 'test-results/browser-unavailable-results.json' }]],
  webServer: {
    ...base.webServer,
    command: 'node scripts/synthetic-server.mjs',
    env: { KNIGHTBITE_TEST_ATRIUM_UNAVAILABLE: '1' },
    url: 'http://127.0.0.1:3217/profile',
    reuseExistingServer: false,
    timeout: 30000
  }
});
