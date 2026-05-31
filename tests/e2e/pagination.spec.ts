import { expect, test } from '@playwright/test';

test.describe('Builder single-page preview', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');
    await page.evaluate(() => window.fillForm?.());
    await expect(page.getByText('Jordan Rivera').first()).toBeVisible();
  });

  test('builder renders the CV as one long scrollable page (no pagination controls)', async ({
    page,
  }) => {
    // No "Page X / N" indicator. No prev/next buttons.
    await expect(page.getByText(/^Page \d+ \/ \d+$/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Previous' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
  });

  test('every section of the sample CV is rendered in the builder', async ({
    page,
  }) => {
    const expectedSectionTitles = [
      'Professional Summary',
      'Experience',
      'Projects',
      'Education',
      'Skills',
      'Languages',
      'Volunteer Experience',
      'Open Source Contributions',
      'Achievements / Awards',
      'Publications',
      'Talks / Conferences / Workshops',
    ];
    for (const title of expectedSectionTitles) {
      await expect(
        page.getByRole('heading', { name: title, exact: true }).first(),
      ).toBeVisible();
    }
  });

  test('cv-preview-content scroll height matches the natural content height (no transform)', async ({
    page,
  }) => {
    const heights = await page.evaluate(() => {
      const content = document.querySelector(
        '.cv-preview-content',
      ) as HTMLElement;
      const transform = getComputedStyle(content).transform;
      return {
        scrollHeight: content.scrollHeight,
        offsetHeight: content.offsetHeight,
        clientHeight: content.clientHeight,
        transform,
      };
    });
    expect(heights.scrollHeight).toBeGreaterThan(1500);
    // Editor mode should never apply a transform.
    expect(heights.transform).toBe('none');
  });
});
