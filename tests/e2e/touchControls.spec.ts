import { expect, test } from '@playwright/test';

/**
 * Entry and section controls are hidden until hover. A touch device has no
 * hover, but tapping still synthesises one — so the first tap both reveals and
 * activates the control underneath. The result is that tapping apparently
 * blank space in a header silently reorders or deletes a section. Anything
 * that reacts to a tap has to be visible before the tap.
 */
test.use({ hasTouch: true });

const toolbarOpacities = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const section = document.querySelector(
      '[data-section-toolbar]',
    ) as HTMLElement | null;
    const entry = document.querySelector(
      '[data-entry-toolbar]',
    ) as HTMLElement | null;
    return {
      section: section ? getComputedStyle(section).opacity : null,
      entry: entry ? getComputedStyle(entry).opacity : null,
    };
  });

test.describe('Touch devices', () => {
  test('editing controls are visible without hovering', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/');
    await page.getByRole('button', { name: /Create new/i }).click();

    const opacities = await toolbarOpacities(page);
    expect(opacities.section, 'section toolbar must not be invisible').toBe(
      '1',
    );
    expect(opacities.entry, 'entry toolbar must not be invisible').toBe('1');
  });

  test('a tap never activates a control the user cannot see', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/');
    await page.getByRole('button', { name: /Create new/i }).click();

    const sectionOrder = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('h2')).map(
          (h) => h.textContent?.trim() ?? '',
        ),
      );
    const before = await sectionOrder();

    const target = await page.evaluate(() => {
      const button = document.querySelector(
        'button[aria-label="Move section up"]:not([disabled])',
      ) as HTMLElement | null;
      if (!button) return null;
      button.scrollIntoView({ block: 'center' });
      const wasVisible =
        getComputedStyle(
          button.closest('[data-section-toolbar]') ?? button,
        ).opacity === '1';
      const r = button.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, wasVisible };
    });
    expect(target).not.toBeNull();

    await page.touchscreen.tap(target!.x, target!.y);
    await page.waitForTimeout(300);

    // Either the control was visible beforehand (so the tap was intentional),
    // or the order must be untouched.
    if (!target!.wasVisible) {
      expect(
        await sectionOrder(),
        'tapping an invisible control reordered the CV',
      ).toEqual(before);
    }
    expect(target!.wasVisible, 'control should be visible on touch').toBe(true);
  });
});
