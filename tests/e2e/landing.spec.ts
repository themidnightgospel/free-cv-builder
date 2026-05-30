import { expect, test } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('renders hero, sample poster and primary CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /Free CV builder/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Create new CV/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Upload existing CV/i }),
    ).toBeVisible();
  });

  test('clicking Create new CV opens the editor with empty header placeholder', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Create new CV/i }).click();
    await expect(
      page.getByRole('button', { name: /Download PDF/i }),
    ).toBeVisible();
    await expect(page.getByText('Your full name')).toBeVisible();
  });

  test('clicking the back button returns to landing', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Create new CV/i }).click();
    await page.getByRole('button', { name: /Back to start/i }).click();
    await expect(
      page.getByRole('heading', { name: /Free CV builder/i }),
    ).toBeVisible();
  });

  test('window.fillForm injects the sample CV', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.fillForm?.());
    await expect(page.getByText('Jordan Rivera').first()).toBeVisible();
    await expect(page.getByText('Senior Frontend Engineer').first()).toBeVisible();
  });
});
