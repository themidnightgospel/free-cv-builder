import { expect, test } from '@playwright/test';

test.describe('Section management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');
    await page.getByRole('button', { name: /Create new CV/i }).click();
  });

  test('default sections render in editor', async ({ page }) => {
    for (const title of ['Experience', 'Education', 'Projects', 'Skills', 'Languages']) {
      await expect(
        page.getByRole('heading', { name: title, exact: true }).first(),
      ).toBeVisible();
    }
  });

  test('removing a section asks for confirmation and includes the item count', async ({
    page,
  }) => {
    const experienceSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Experience' }) })
      .first();
    await experienceSection.hover();
    await experienceSection
      .getByRole('button', { name: /Delete section/i })
      .click();
    // Confirm dialog appears, mentions the section and the entire-section copy.
    await expect(
      page.getByRole('heading', { name: /Delete Experience section\?/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/entire Experience section/i),
    ).toBeVisible();
    await expect(page.getByText(/item|items/)).toBeVisible();
    // Two buttons named "Delete section": the chrome trigger and the confirm
    // CTA. The confirm CTA is the second.
    await page.getByRole('button', { name: 'Delete section' }).last().click();
    await expect(
      page.getByRole('heading', { name: 'Experience', exact: true }),
    ).toHaveCount(0);
  });

  test('cancelling the confirmation keeps the section', async ({ page }) => {
    const experienceSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Experience' }) })
      .first();
    await experienceSection.hover();
    await experienceSection
      .getByRole('button', { name: /Delete section/i })
      .click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(
      page.getByRole('heading', { name: 'Experience', exact: true }),
    ).toBeVisible();
  });

  test('moving Education up changes section order', async ({ page }) => {
    const educationSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Education' }) })
      .first();
    await educationSection.hover();
    const headingsBefore = await page.locator('section h2').allTextContents();
    await educationSection
      .getByRole('button', { name: /Move section up/i })
      .click();
    const headingsAfter = await page.locator('section h2').allTextContents();
    expect(headingsAfter).not.toEqual(headingsBefore);
  });

  test('add custom section via the section gap', async ({ page }) => {
    const gap = page.getByRole('button', { name: /Add section here/i }).first();
    await gap.click();
    await page.getByRole('button', { name: /Custom/ }).first().click();
    await expect(
      page.locator('section').filter({ hasText: 'New section' }).first(),
    ).toBeVisible();
  });
});
