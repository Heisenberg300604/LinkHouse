import { assertTestDatabase } from './lib/logic/database-safety';
import { defineConfig } from '@playwright/test';
import { config } from 'dotenv';
config({ path: '.env.local', quiet: true });
const missing = [
  'TEST_DATABASE_URL',
  'TEST_DIRECT_URL',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'E2E_CLERK_USER_USERNAME',
  'E2E_CLERK_USER_PASSWORD',
  'E2E_CLERK_USER_B_USERNAME',
  'E2E_CLERK_USER_B_PASSWORD',
].some((k) => !process.env[k]);
if (process.env.TEST_DATABASE_URL)
  assertTestDatabase(process.env.TEST_DATABASE_URL, process.env.DATABASE_URL);
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }], ['./tests/e2e/reporters/runs-reporter.ts']],
  use: {
    baseURL: 'http://localhost:3100',
    viewport: { width: 1280, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'off',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: missing
    ? undefined
    : {
        command: 'npm run dev -- --port 3100',
        url: 'http://localhost:3100',
        reuseExistingServer: false,
        env: {
          DATABASE_URL: process.env.TEST_DATABASE_URL!,
          DIRECT_URL: process.env.TEST_DIRECT_URL!,
        },
      },
});
