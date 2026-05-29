import { test, expect } from '@playwright/test';

test('BillQyro website opens', async ({ page }) => {
  await page.goto('https://billqyro-app.vercel.app');
  await expect(page).toHaveTitle(/BillQyro|BillMint|Billing/i);
});

test('BillQyro mobile view opens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('https://billqyro-app.vercel.app');
  await expect(page).toHaveTitle(/BillQyro|BillMint|Billing/i);
});

test('BillQyro has no console errors', async ({ page }) => {
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('https://billqyro-app.vercel.app');
  await page.waitForTimeout(3000);

  expect(errors).toEqual([]);
});

test('BillQyro login page has required fields', async ({ page }) => {
  await page.goto('https://billqyro-app.vercel.app');

  await expect(page.locator('input[type="email"]').first()).toBeVisible();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
  await expect(page.locator('button').first()).toBeVisible();
});
