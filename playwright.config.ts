import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: true,
  use: { ...devices['Pixel 5'], viewport: { width: 360, height: 640 }, baseURL: 'http://127.0.0.1:4173/Destreza/', serviceWorkers: 'allow', trace: 'retain-on-failure' },
  webServer: { command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173/Destreza/', reuseExistingServer: !process.env.CI },
});
