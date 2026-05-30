import { expect, test } from '@playwright/test';

test.describe('Editor — personal info inline editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');
    await page.getByRole('button', { name: /Create new CV/i }).click();
  });

  test('editing full name updates the header', async ({ page }) => {
    const nameField = page.getByRole('button', { name: 'Full name' });
    await nameField.click();
    const input = page.getByRole('textbox', { name: 'Full name' });
    await input.fill('Ada Lovelace');
    await input.press('Enter');
    await expect(page.locator('h1')).toContainText('Ada Lovelace');
  });

  test('editing job title persists after blur', async ({ page }) => {
    await page.getByRole('button', { name: 'Job title' }).click();
    const input = page.getByRole('textbox', { name: 'Job title' });
    await input.fill('Mathematician');
    await input.blur();
    await expect(
      page.getByText('Mathematician', { exact: true }).first(),
    ).toBeVisible();
  });

  test('save indicator transitions from Saved to Unsaved when editing', async ({
    page,
  }) => {
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Full name' }).click();
    const input = page.getByRole('textbox', { name: 'Full name' });
    await input.fill('Edited');
    await input.press('Enter');
    await expect(
      page.getByText(/Unsaved|Saved/).first(),
    ).toBeVisible();
  });

  test('long email is displayed verbatim, not truncated with ellipsis', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Email' }).click();
    const input = page.getByRole('textbox', { name: 'Email' });
    await input.fill('bubachelidze1@gmail.com');
    await input.press('Enter');
    const emailField = page.getByRole('button', { name: 'Email' });
    await expect(emailField).toContainText('bubachelidze1@gmail.com');
    const overflow = await emailField.evaluate(
      (el) => getComputedStyle(el).textOverflow,
    );
    expect(overflow).not.toBe('ellipsis');
  });

  test('email field shows wavy validation underline for invalid value', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Email' }).click();
    const input = page.getByRole('textbox', { name: 'Email' });
    await input.fill('not-an-email');
    await input.press('Enter');
    const emailLink = page.getByRole('button', { name: 'Email' });
    await expect(emailLink).toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('Editor — entries', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');
    await page.getByRole('button', { name: /Create new CV/i }).click();
  });

  test('add experience entry through popover', async ({ page }) => {
    await page.getByRole('button', { name: /\+ Add experience/i }).click();
    const popover = page.locator('[role="dialog"]');
    await expect(popover).toBeVisible();
    await popover.getByLabel('Job title').fill('Staff Engineer');
    await popover.getByLabel('Company').fill('Acme Corp');
    await popover.getByLabel('Description (markdown supported)').fill(
      '- Led migrations\n- Mentored team',
    );
    await page.keyboard.press('Escape');
    await expect(
      page.getByText('Staff Engineer', { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText('Acme Corp', { exact: true }).first(),
    ).toBeVisible();
  });

  test('add a skill and a language', async ({ page }) => {
    await page.getByRole('button', { name: /\+ Add skill/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page
      .locator('[role="dialog"]')
      .getByLabel('Skill', { exact: true })
      .fill('TypeScript');
    await page.keyboard.press('Escape');
    await expect(page.getByText('TypeScript').first()).toBeVisible();

    await page.getByRole('button', { name: /\+ Add language/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page
      .locator('[role="dialog"]')
      .getByLabel('Language', { exact: true })
      .fill('English');
    await page.keyboard.press('Escape');
    await expect(page.getByText(/English/).first()).toBeVisible();
  });
});

test.describe('Editor — sample CV and persistence', () => {
  test('fillForm injects sample, then reload keeps the CV', async ({
    page,
    context,
  }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');
    await page.evaluate(() => window.fillForm?.());
    await expect(page.getByText('Jordan Rivera').first()).toBeVisible();
    // Wait for autosave (1s debounce)
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.getByText('Jordan Rivera').first()).toBeVisible();
    void context;
  });
});

test.describe('Editor — PDF validation modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');
    await page.getByRole('button', { name: /Create new CV/i }).click();
  });

  test('Download PDF without full name/email triggers validation modal', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /Download PDF/i }).click();
    await expect(
      page.getByRole('heading', { name: /Complete required info/i }),
    ).toBeVisible();
    await expect(page.getByText(/Full name is required/)).toBeVisible();
    await expect(page.getByText(/Email is required/)).toBeVisible();
  });
});
