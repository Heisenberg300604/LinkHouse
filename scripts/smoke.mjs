import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
const issues = [];
page.on('pageerror', (e) => issues.push(e.message));
for (const width of [375, 768, 1280]) {
  await page.setViewportSize({ width, height: 950 });
  await page.goto('http://localhost:3000');
  await page.getByRole('heading', { name: 'Many sides of you. One simple link.' }).waitFor();
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  if (!fits) throw new Error('Horizontal overflow at ' + width);
  await page.screenshot({ path: 'artifacts/landing-' + width + '.png', fullPage: true });
}
await page.getByRole('button', { name: 'Toggle color theme' }).click();
await page.screenshot({ path: 'artifacts/landing-dark.png', fullPage: true });
await page.goto('http://localhost:3000/dashboard');
if (!page.url().includes('/sign-in')) throw new Error('Private route did not redirect');
const response = await page.request.post('http://localhost:3000/api/webhooks/clerk', { data: {} });
if (response.status() !== 503) throw new Error('Unconfigured webhook did not fail closed');
if (issues.length) throw new Error(issues.join('\n'));
console.log(
  'PASS: landing 375/768/1280, theme toggle, anonymous dashboard redirect, unconfigured webhook fails closed; no browser errors.',
);
await browser.close();
