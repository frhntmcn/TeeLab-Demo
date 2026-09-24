import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:5185',
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite --config vite.config.ts --configLoader runner --host 127.0.0.1 --port 5185 --strictPort',
    url: 'http://127.0.0.1:5185/studio',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
