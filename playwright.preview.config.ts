import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testDir: './tests/browser-preview',
  outputDir: 'test-results/playwright-preview',
  reporter: [['list'], ['json', { outputFile: 'test-results/browser-preview-results.json' }]],
  webServer: {
    ...base.webServer,
    command: 'node scripts/synthetic-server.mjs',
    env: { VERCEL_ENV: 'preview' },
    url: 'http://127.0.0.1:3217/preview-check',
    reuseExistingServer: false,
    timeout: 30000
  }
});
