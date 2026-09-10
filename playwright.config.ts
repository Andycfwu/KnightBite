import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser', fullyParallel:false, workers:1, retries:0,
  outputDir:'test-results/playwright',
  use:{baseURL:'http://127.0.0.1:3217',serviceWorkers:'block',trace:'retain-on-failure'},
  reporter:[['list'],['json',{outputFile:'test-results/browser-results.json'}]],
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}},{name:'webkit',use:{...devices['Desktop Safari']}}],
  webServer:{command:'node scripts/synthetic-server.mjs',url:'http://127.0.0.1:3217/profile',reuseExistingServer:false,timeout:30000}
});
