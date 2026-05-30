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

  test('removing a section hides it from the preview', async ({ page }) => {
    const experienceSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Experience' }) })
      .first();
    await experienceSection.hover();
    await experienceSection
      .getByRole('button', { name: /Delete section/i })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Experience', exact: true }),
    ).toHaveCount(0);
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
