import { test, expect, type Page } from '@playwright/test';
import { clerk, clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { resetFixtures } from './fixtures';
export { expect };
export const missing = [
  'TEST_DATABASE_URL',
  'TEST_DIRECT_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'E2E_CLERK_USER_USERNAME',
  'E2E_CLERK_USER_PASSWORD',
  'E2E_CLERK_USER_B_USERNAME',
  'E2E_CLERK_USER_B_PASSWORD',
].filter((k) => !process.env[k]);
type Meta = {
  category: 'happy' | 'negative' | 'edge';
  severity: 'critical' | 'high' | 'medium' | 'low';
  feature: 'auth' | 'links' | 'sections' | 'profile' | 'public' | 'isolation' | 'settings';
  description: string;
};
export function scenario(title: string, meta: Meta, body: Parameters<typeof test>[2]) {
  if (!meta.description) throw new Error('Every E2E test requires metadata');
  test(
    title + ' @' + meta.category + ' @' + meta.severity,
    { annotation: Object.entries(meta).map(([type, description]) => ({ type, description })) },
    body,
  );
}
test.beforeAll(async () => {
  if (!missing.length) {
    if (!process.env.CLERK_SECRET_KEY?.startsWith('sk_test_'))
      throw new Error('E2E requires a Clerk development instance');
    await clerkSetup({ publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY });
  }
});
test.beforeEach(async () => {
  test.skip(missing.length > 0, 'Missing credentials: ' + missing.join(', '));
  await resetFixtures();
});
export async function signIn(page: Page, second = false) {
  await setupClerkTestingToken({ page });
  await page.goto('/sign-in');
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env[second ? 'E2E_CLERK_USER_B_USERNAME' : 'E2E_CLERK_USER_USERNAME']!,
      password: process.env[second ? 'E2E_CLERK_USER_B_PASSWORD' : 'E2E_CLERK_USER_PASSWORD']!,
    },
  });
  await page.goto('/dashboard');
}
