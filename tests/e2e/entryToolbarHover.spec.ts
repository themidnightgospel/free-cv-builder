import { expect, test } from '@playwright/test';

/**
 * The entry toolbar floats above the entry it belongs to. Reaching it means
 * moving the pointer off the entry's top edge, so the strip between the two
 * must belong to one of them — otherwise the group loses :hover, the toolbar
 * hides itself, and the pointer lands on the entry above instead.
 */

/** Geometry of the second experience entry and its "Move up" button. */
const probe = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const matches = Array.from(document.querySelectorAll('*')).filter(
      (n) => n.textContent?.trim() === 'Second',
    );
    const label = matches[matches.length - 1];
    const group = label?.closest('.group') as HTMLElement | null;
    const button = group?.querySelector(
      'button[aria-label="Move up"]',
    ) as HTMLElement | null;
    if (!group || !button) return null;
    // The entry can sit below the fold; hovering coordinates outside the
    // viewport does nothing, so bring it into view before measuring.
    group.scrollIntoView({ block: 'center' });
    const toolbar = button.closest('[data-entry-toolbar]') as HTMLElement;
    const g = group.getBoundingClientRect();
    const t = toolbar.getBoundingClientRect();
    const b = button.getBoundingClientRect();
    return {
      groupCentre: { x: g.x + g.width / 2, y: g.y + g.height / 2 },
      buttonCentre: { x: b.x + b.width / 2, y: b.y + b.height / 2 },
      // The vertical strip between the toolbar's bottom and the entry's top.
      gapPx: Math.round(g.y - (t.y + t.height)),
    };
  });

const toolbarOpacity = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const matches = Array.from(document.querySelectorAll('*')).filter(
      (n) => n.textContent?.trim() === 'Second',
    );
    const button = matches[matches.length - 1]
      ?.closest('.group')
      ?.querySelector('button[aria-label="Move up"]') as HTMLElement | null;
    const toolbar = button?.closest('[data-entry-toolbar]');
    if (!toolbar) return null;
    return getComputedStyle(toolbar).opacity;
  });

test.describe('Entry toolbar hover', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/');
    await page.getByRole('button', { name: /Create new/i }).click();

    // A fresh CV starts with one experience entry; add a second.
    await page.getByRole('button', { name: /Add experience/i }).click();

    const titles = page.getByRole('button', { name: 'Job title' });
    for (const [index, value] of [
      [1, 'First'],
      [2, 'Second'],
    ] as const) {
      await titles.nth(index).click();
      const input = page.getByRole('textbox', { name: 'Job title' }).first();
      await input.fill(value);
      await input.press('Enter');
    }
  });

  test('toolbar stays reachable when the pointer travels up to it', async ({
    page,
  }) => {
    const geometry = await probe(page);
    expect(geometry, 'second entry and its toolbar should exist').not.toBeNull();

    await page.mouse.move(geometry!.groupCentre.x, geometry!.groupCentre.y);
    // Poll — the toolbar fades in via a CSS transition.
    await expect
      .poll(() => toolbarOpacity(page), { timeout: 5_000 })
      .toBe('1');

    // Walk the pointer up to the button the way a user would, crossing the
    // strip between the entry and the toolbar.
    await page.mouse.move(geometry!.buttonCentre.x, geometry!.buttonCentre.y, {
      steps: 25,
    });

    await expect
      .poll(() => toolbarOpacity(page), {
        timeout: 5_000,
        message: 'toolbar must not vanish while the pointer moves onto it',
      })
      .toBe('1');
  });

  test('clicking Move up from a travelling pointer reorders that entry', async ({
    page,
  }) => {
    const geometry = await probe(page);
    await page.mouse.move(geometry!.groupCentre.x, geometry!.groupCentre.y);
    await page.mouse.move(geometry!.buttonCentre.x, geometry!.buttonCentre.y, {
      steps: 25,
    });
    await page.mouse.down();
    await page.mouse.up();

    // "Second" was below "First"; moving it up must swap them.
    await expect
      .poll(async () =>
        (await page.getByRole('button', { name: 'Job title' }).allTextContents())
          .map((t) => t.trim())
          .filter((t) => t === 'First' || t === 'Second'),
      )
      .toEqual(['Second', 'First']);
  });

  test('the toolbar does not swallow clicks meant for the entry above', async ({
    page,
  }) => {
    const points = await page.evaluate(() => {
      const matches = Array.from(document.querySelectorAll('*')).filter(
        (n) => n.textContent?.trim() === 'Second',
      );
      const second = matches[matches.length - 1]!.closest(
        '.group',
      ) as HTMLElement;
      second.scrollIntoView({ block: 'center' });
      const toolbar = second.querySelector(
        '[data-entry-toolbar]',
      ) as HTMLElement;
      const s = second.getBoundingClientRect();
      const t = toolbar.getBoundingClientRect();
      return {
        secondCentre: { x: s.x + s.width / 2, y: s.y + s.height / 2 },
        // Left of the toolbar, vertically level with it: this is the previous
        // entry's content, and must stay clickable.
        aboveLeft: { x: s.x + 60, y: t.y + t.height / 2 },
      };
    });

    await page.mouse.move(points.secondCentre.x, points.secondCentre.y);
    await page.waitForTimeout(300);
    await page.mouse.move(points.aboveLeft.x, points.aboveLeft.y, {
      steps: 20,
    });

    const intercepted = await page.evaluate(
      ({ x, y }) =>
        !!(document.elementFromPoint(x, y) as HTMLElement | null)?.closest(
          '[data-entry-toolbar]',
        ),
      points.aboveLeft,
    );
    expect(
      intercepted,
      'the hover bridge must not cover the neighbouring entry',
    ).toBe(false);
  });
});
