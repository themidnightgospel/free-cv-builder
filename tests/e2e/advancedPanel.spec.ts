import { expect, test } from '@playwright/test';

test.describe('Advanced settings panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');
    await page.getByRole('button', { name: /Create new CV/i }).click();
  });

  test('panel is collapsed by default and expands on click', async ({
    page,
  }) => {
    const panel = page.getByTestId('advanced-panel');
    await expect(panel).toBeVisible();
    await expect(page.locator('#advanced-panel-body')).toBeHidden();
    await page.getByTestId('advanced-toggle').click();
    await expect(page.locator('#advanced-panel-body')).toBeVisible();
  });

  test('changing accent color updates link color CSS variable', async ({
    page,
  }) => {
    await page.getByTestId('advanced-toggle').click();
    const colorPicker = page.getByTestId('advanced-accent-color');
    await colorPicker.evaluate((el, value) => {
      const input = el as HTMLInputElement;
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )?.set;
      nativeSetter?.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, '#ff8800');
    const previewVar = await page
      .locator('.cv-preview-content')
      .first()
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue('--cv-accent').trim(),
      );
    expect(previewVar).toBe('#ff8800');
  });

  test('toggling section dividers adds a CSS class to the preview', async ({
    page,
  }) => {
    await page.getByTestId('advanced-toggle').click();
    const preview = page.locator('.cv-preview-content').first();
    await expect(preview).not.toHaveClass(/cv-preview-content--dividers/);
    await page.getByTestId('advanced-show-dividers').check();
    await expect(preview).toHaveClass(/cv-preview-content--dividers/);
  });

  test('reset button restores defaults', async ({ page }) => {
    await page.getByTestId('advanced-toggle').click();
    const fullNameInput = page.getByRole('spinbutton', { name: 'Full name' });
    await fullNameInput.fill('20');
    await fullNameInput.blur();
    await expect(fullNameInput).toHaveValue('20');
    await page.getByTestId('advanced-reset').click();
    await expect(fullNameInput).toHaveValue('28');
  });

  test('changing section gap mutates --cv-section-gap variable', async ({
    page,
  }) => {
    await page.getByTestId('advanced-toggle').click();
    const sectionGapInput = page.getByRole('spinbutton', {
      name: 'Section gap',
    });
    await sectionGapInput.fill('30');
    await sectionGapInput.blur();
    const previewVar = await page
      .locator('.cv-preview-content')
      .first()
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue('--cv-section-gap').trim(),
      );
    expect(previewVar).toBe('30px');
  });
});
