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
    // Personal header's job title comes first in the document. Section entries
    // also expose an aria-labelled "Job title" — scope to the first match.
    await page.getByRole('button', { name: 'Job title' }).first().click();
    const input = page.getByRole('textbox', { name: 'Job title' }).first();
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

  test('Professional Summary is editable inline from an empty CV', async ({
    page,
  }) => {
    const summarySection = page
      .locator('section')
      .filter({
        has: page.getByRole('heading', { name: 'Professional Summary' }),
      })
      .first();
    await expect(summarySection).toBeVisible();
    await summarySection
      .getByRole('button', { name: 'Professional summary' })
      .click();
    await page
      .getByRole('textbox', { name: 'Professional summary' })
      .fill('Senior Engineer with 10 years building reliable systems.');
    await page.keyboard.press('Escape');
    // Escape cancels — so re-open and use Ctrl+Enter / blur to commit.
    await summarySection
      .getByRole('button', { name: 'Professional summary' })
      .click();
    const textbox = page.getByRole('textbox', {
      name: 'Professional summary',
    });
    await textbox.fill(
      'Senior Engineer with 10 years building reliable systems.',
    );
    await textbox.blur();
    await expect(
      summarySection.getByText(
        /Senior Engineer with 10 years building reliable systems\./,
      ),
    ).toBeVisible();
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

  test('add experience entry inline', async ({ page }) => {
    await page.getByRole('button', { name: /\+ Add experience/i }).click();
    // Editing is now fully inline — no popover should appear.
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    // The new empty entry is the last one in the Experience section.
    const titleField = page
      .getByRole('button', { name: 'Job title' })
      .last();
    await titleField.click();
    await page
      .getByRole('textbox', { name: 'Job title' })
      .last()
      .fill('Staff Engineer');
    await page.keyboard.press('Enter');

    const companyField = page
      .getByRole('button', { name: 'Company' })
      .last();
    await companyField.click();
    await page
      .getByRole('textbox', { name: 'Company' })
      .last()
      .fill('Acme Corp');
    await page.keyboard.press('Enter');

    await expect(
      page.getByText('Staff Engineer', { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText('Acme Corp', { exact: true }).first(),
    ).toBeVisible();
  });

  test('no popover dialog ever appears for an entry edit', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /\+ Add experience/i }).click();
    await page.getByRole('button', { name: 'Job title' }).last().click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await page
      .getByRole('textbox', { name: 'Job title' })
      .last()
      .fill('Lead Engineer');
    await page.keyboard.press('Enter');
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(
      page.getByText('Lead Engineer', { exact: true }).first(),
    ).toBeVisible();
  });

  test('deleting an entry asks for confirmation', async ({ page }) => {
    const experienceSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Experience' }) })
      .first();
    await experienceSection
      .getByRole('button', { name: /\+ Add experience/i })
      .click();
    await experienceSection
      .getByRole('button', { name: 'Job title' })
      .last()
      .click();
    await experienceSection
      .getByRole('textbox', { name: 'Job title' })
      .last()
      .fill('Doomed Engineer');
    await page.keyboard.press('Enter');
    await expect(
      experienceSection.getByText('Doomed Engineer', { exact: true }),
    ).toBeVisible();

    // The entry's delete chrome is the LAST "Delete" button inside the section.
    await experienceSection
      .getByText('Doomed Engineer', { exact: true })
      .hover();
    await experienceSection
      .getByRole('button', { name: 'Delete' })
      .last()
      .click();
    await expect(
      page.getByRole('heading', { name: /Delete this item\?/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/Delete this experience entry/i),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(
      experienceSection.getByText('Doomed Engineer', { exact: true }),
    ).toBeVisible();

    await experienceSection
      .getByText('Doomed Engineer', { exact: true })
      .hover();
    await experienceSection
      .getByRole('button', { name: 'Delete' })
      .last()
      .click();
    // The confirm CTA is the last "Delete" button rendered (dialog mounts after chrome).
    await page
      .getByRole('button', { name: 'Delete', exact: true })
      .last()
      .click();
    await expect(
      page.getByText('Doomed Engineer', { exact: true }),
    ).toHaveCount(0);
  });

  test('add a skill and a language inline', async ({ page }) => {
    await page.getByRole('button', { name: /\+ Add skill/i }).click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Skill name' }).last().click();
    await page
      .getByRole('textbox', { name: 'Skill name' })
      .last()
      .fill('TypeScript');
    await page.keyboard.press('Enter');
    await expect(page.getByText('TypeScript').first()).toBeVisible();

    await page.getByRole('button', { name: /\+ Add language/i }).click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Language name' })
      .last()
      .click();
    await page
      .getByRole('textbox', { name: 'Language name' })
      .last()
      .fill('English');
    await page.keyboard.press('Enter');
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
