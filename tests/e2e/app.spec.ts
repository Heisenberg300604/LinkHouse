import { scenario, expect, signIn } from './helpers/meta';
scenario(
  'Sign in reaches the private workspace',
  {
    category: 'happy',
    severity: 'critical',
    feature: 'auth',
    description: 'A valid Clerk user can reach the dashboard or onboarding.',
  },
  async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/dashboard|onboarding/);
  },
);
scenario(
  'Private workspace requires authentication',
  {
    category: 'negative',
    severity: 'critical',
    feature: 'auth',
    description: 'An anonymous visitor is redirected to sign-in.',
  },
  async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/);
  },
);
scenario(
  'Onboarding survives refresh',
  {
    category: 'edge',
    severity: 'high',
    feature: 'auth',
    description: 'Refreshing preserves the correct onboarding or dashboard destination.',
  },
  async ({ page }) => {
    await signIn(page);
    const url = page.url();
    await page.reload();
    await expect(page).toHaveURL(url);
  },
);
scenario(
  'Add, edit, hide and delete a link',
  {
    category: 'happy',
    severity: 'high',
    feature: 'links',
    description: 'Link editing persists and delete removes the card.',
  },
  async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: 'Add link', exact: true }).click();
    await page.getByLabel('Title', { exact: true }).fill('E2E portfolio');
    await page.getByLabel('URL', { exact: true }).fill('https://example.com');
    await page.getByRole('button', { name: 'Save link' }).click();
    await expect(page.getByRole('button', { name: 'Edit E2E portfolio' })).toBeVisible();
    await page.getByRole('button', { name: 'Edit E2E portfolio' }).click();
    await page.getByLabel('Title', { exact: true }).fill('E2E edited');
    await page.getByRole('button', { name: 'Save link' }).click();
    await page.getByRole('button', { name: 'Hide E2E edited' }).click();
    await expect(page.getByRole('button', { name: 'Show E2E edited' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete E2E edited' }).click();
    await page.getByRole('button', { name: 'Confirm delete' }).click();
    await expect(page.getByRole('button', { name: 'Edit E2E edited' })).toHaveCount(0);
  },
);
scenario(
  'Reject executable URL schemes',
  {
    category: 'negative',
    severity: 'high',
    feature: 'links',
    description: 'Unsafe URLs are rejected without creating a link.',
  },
  async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: 'Add link', exact: true }).click();
    await page.getByLabel('Title', { exact: true }).fill('Unsafe');
    await page.getByLabel('URL', { exact: true }).fill('javascript:alert(1)');
    await page.getByRole('button', { name: 'Save link' }).click();
    await expect(page.getByRole('alert')).toContainText('valid http');
  },
);
scenario(
  'Normalize schemeless URLs and accept emoji',
  {
    category: 'edge',
    severity: 'medium',
    feature: 'links',
    description: 'A URL without a scheme is normalized and an emoji title is preserved.',
  },
  async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: 'Add link', exact: true }).click();
    await page.getByLabel('Title', { exact: true }).fill('E2E 🌱');
    await page.getByLabel('URL', { exact: true }).fill('example.com');
    await page.getByRole('button', { name: 'Save link' }).click();
    await expect(page.getByText('https://example.com/', { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Delete E2E 🌱' }).click();
    await page.getByRole('button', { name: 'Confirm delete' }).click();
  },
);
scenario(
  'Create and rename a section',
  {
    category: 'happy',
    severity: 'high',
    feature: 'sections',
    description: 'Sections can be created and renamed.',
  },
  async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: 'Add section' }).click();
    await page.getByLabel('Section name').fill('E2E Social');
    await page.getByRole('button', { name: 'Save section' }).click();
    await page.getByRole('button', { name: 'Rename E2E Social' }).click();
    await page.getByLabel('Section name').fill('E2E Renamed');
    await page.getByRole('button', { name: 'Save section' }).click();
    await expect(page.getByRole('heading', { name: 'E2E Renamed' })).toBeVisible();
  },
);
scenario(
  'Reject an empty section name',
  {
    category: 'negative',
    severity: 'high',
    feature: 'sections',
    description: 'Empty section names produce validation feedback.',
  },
  async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: 'Add section' }).click();
    await page.getByRole('button', { name: 'Save section' }).click();
    await expect(page.getByRole('alert')).toContainText('required');
  },
);
scenario(
  'Deleting a section offers both retention choices',
  {
    category: 'edge',
    severity: 'high',
    feature: 'sections',
    description: 'Section deletion explicitly offers keeping or deleting its links.',
  },
  async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: 'Add section' }).click();
    await page.getByLabel('Section name').fill('E2E Renamed');
    await page.getByRole('button', { name: 'Save section' }).click();
    await page.getByRole('button', { name: 'Delete section E2E Renamed' }).click();
    await expect(page.getByLabel('Also delete links in this section')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm delete' }).click();
  },
);
scenario(
  'Save public profile',
  {
    category: 'happy',
    severity: 'medium',
    feature: 'profile',
    description: 'Profile changes persist after refresh.',
  },
  async ({ page }) => {
    await signIn(page);
    await page.goto('/dashboard/profile');
    await page.getByLabel('Display name').fill('E2E Creator');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText('Changes saved')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Display name')).toHaveValue('E2E Creator');
  },
);
scenario(
  'Reject a reserved profile username',
  {
    category: 'negative',
    severity: 'high',
    feature: 'profile',
    description: 'Reserved names cannot replace a public username.',
  },
  async ({ page }) => {
    await signIn(page);
    await page.goto('/dashboard/profile');
    await page.getByLabel('Username').fill('admin');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByRole('alert')).toContainText('reserved');
  },
);
scenario(
  'Allow a bio at exactly 160 characters',
  {
    category: 'edge',
    severity: 'medium',
    feature: 'profile',
    description: 'The maximum valid bio saves without truncation.',
  },
  async ({ page }) => {
    await signIn(page);
    await page.goto('/dashboard/profile');
    await page.getByLabel('Bio').fill('a'.repeat(160));
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText('Changes saved')).toBeVisible();
  },
);
scenario(
  'Public demo renders links',
  {
    category: 'happy',
    severity: 'critical',
    feature: 'public',
    description: 'The seeded public profile renders its sections and redirect links.',
  },
  async ({ page }) => {
    await page.goto('/demo');
    await expect(page.getByRole('heading', { name: 'Alex Morgan' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My portfolio' })).toHaveAttribute(
      'href',
      '/r/demo-link-0',
    );
  },
);
scenario(
  'Unknown public pages return 404',
  {
    category: 'negative',
    severity: 'critical',
    feature: 'public',
    description: 'Unknown usernames and redirect IDs return 404 safely.',
  },
  async ({ page, request }) => {
    expect((await page.goto('/unknown-e2e-person'))?.status()).toBe(404);
    expect((await request.get('/r/unknown-e2e-link')).status()).toBe(404);
  },
);
scenario(
  'Public layout fits all target widths',
  {
    category: 'edge',
    severity: 'low',
    feature: 'public',
    description: 'Mobile, tablet and desktop layouts avoid horizontal overflow.',
  },
  async ({ page }) => {
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/demo');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  },
);
scenario(
  'User sees their own workspace',
  {
    category: 'happy',
    severity: 'critical',
    feature: 'isolation',
    description: 'An authenticated user can access their own editor.',
  },
  async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole('heading', { name: 'Your links' })).toBeVisible();
  },
);
scenario(
  'Second user cannot see first user private links',
  {
    category: 'negative',
    severity: 'critical',
    feature: 'isolation',
    description: 'A second account does not receive the first account private link cards.',
  },
  async ({ page }) => {
    await signIn(page, true);
    await expect(page.getByRole('button', { name: 'Edit E2E private sentinel' })).toHaveCount(0);
  },
);
scenario(
  'Session expiry returns to sign-in',
  {
    category: 'edge',
    severity: 'critical',
    feature: 'isolation',
    description: 'Expired sessions cannot continue editing private content.',
  },
  async ({ page, context }) => {
    await signIn(page);
    await context.clearCookies();
    await page.reload();
    await expect(page).toHaveURL(/sign-in/);
  },
);
scenario(
  'Settings exposes Clerk security controls',
  {
    category: 'happy',
    severity: 'critical',
    feature: 'settings',
    description: 'Settings offers Clerk account management and account deletion.',
  },
  async ({ page }) => {
    await signIn(page);
    await page.goto('/dashboard/settings');
    await expect(page.getByRole('button', { name: 'Delete account', exact: true })).toBeVisible();
    await expect(page.getByText('Account settings')).toBeVisible();
  },
);
scenario(
  'Cancel account deletion',
  {
    category: 'negative',
    severity: 'critical',
    feature: 'settings',
    description: 'Cancelling deletion leaves the account intact.',
  },
  async ({ page }) => {
    await signIn(page);
    await page.goto('/dashboard/settings');
    await page.getByRole('button', { name: 'Delete account', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Delete account', exact: true })).toBeVisible();
  },
);
scenario(
  'Deletion explains cascading data loss',
  {
    category: 'edge',
    severity: 'critical',
    feature: 'settings',
    description: 'The deletion confirmation warns that all links and sections are removed.',
  },
  async ({ page }) => {
    await signIn(page);
    await page.goto('/dashboard/settings');
    await page.getByRole('button', { name: 'Delete account', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('all your links, sections and analytics');
    await page.getByRole('button', { name: 'Cancel' }).click();
  },
);
