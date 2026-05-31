import { expect, test } from '@playwright/test';

test.describe('Preview pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');
    await page.evaluate(() => window.fillForm?.());
    await expect(page.getByText('Jordan Rivera').first()).toBeVisible();
  });

  test('sample CV spans multiple pages', async ({ page }) => {
    const indicator = page.getByText(/^Page \d+ \/ \d+$/);
    await expect(indicator).toBeVisible();
    const text = (await indicator.textContent()) ?? '';
    const match = text.match(/Page (\d+) \/ (\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match?.[2])).toBeGreaterThan(1);
    expect(Number(match?.[1])).toBe(1);
  });

  test('clicking Next advances the page indicator and shifts content', async ({
    page,
  }) => {
    const next = page.getByRole('button', { name: 'Next' });
    const indicator = page.getByText(/^Page \d+ \/ \d+$/);
    await expect(indicator).toContainText(/^Page 1 \/ /);
    const transformBefore = await page
      .locator('.cv-preview-content')
      .first()
      .evaluate((el) => getComputedStyle(el).transform);
    await next.click();
    await expect(indicator).toContainText(/^Page 2 \/ /);
    const transformAfter = await page
      .locator('.cv-preview-content')
      .first()
      .evaluate((el) => getComputedStyle(el).transform);
    expect(transformAfter).not.toBe(transformBefore);
    expect(transformAfter).toMatch(/matrix\(1,\s*0,\s*0,\s*1,\s*0,\s*-\d+/);
  });

  test('Previous is disabled on the first page', async ({ page }) => {
    const prev = page.getByRole('button', { name: 'Previous' });
    await expect(prev).toBeDisabled();
  });

  test('Next is disabled on the last page', async ({ page }) => {
    const next = page.getByRole('button', { name: 'Next' });
    const indicator = page.getByText(/^Page \d+ \/ \d+$/);
    const initial = (await indicator.textContent()) ?? '';
    const total = Number(initial.match(/\/ (\d+)/)?.[1] ?? '1');
    for (let i = 1; i < total; i += 1) {
      await next.click();
    }
    await expect(indicator).toContainText(`Page ${total} / ${total}`);
    await expect(next).toBeDisabled();
  });

  test('page 2 starts at an atomic block boundary, not mid-line', async ({
    page,
  }) => {
    const indicator = page.getByText(/^Page \d+ \/ \d+$/);
    await expect(indicator).toContainText(/^Page 1 \/ [23456789]/);
    const next = page.getByRole('button', { name: 'Next' });
    await next.click();
    await expect(indicator).toContainText(/^Page 2 \/ /);
    await page.waitForTimeout(300);
    const offsets = await page.evaluate(() => {
      const content = document.querySelector(
        '.cv-preview-content',
      ) as HTMLElement | null;
      if (!content) return null;
      const matrix = new DOMMatrixReadOnly(getComputedStyle(content).transform);
      const translateY = matrix.f;
      const contentRect = content.getBoundingClientRect();
      const atomicTops: number[] = [];
      const sections = Array.from(
        content.querySelectorAll<HTMLElement>('section'),
      );
      for (const section of sections) {
        const heading = section.querySelector<HTMLElement>(':scope > h2');
        if (heading) {
          atomicTops.push(
            heading.getBoundingClientRect().top - contentRect.top,
          );
        }
        const entries = Array.from(
          section.querySelectorAll<HTMLElement>(':scope > div > div'),
        );
        for (const entry of entries) {
          atomicTops.push(
            entry.getBoundingClientRect().top - contentRect.top,
          );
        }
      }
      return { translateY, atomicTops };
    });
    expect(offsets).not.toBeNull();
    const { translateY, atomicTops } = offsets!;
    const shift = -translateY;
    const tolerance = 1;
    const isAtomicStart = atomicTops.some(
      (top) => Math.abs(top - shift) <= tolerance,
    );
    expect(isAtomicStart).toBe(true);
  });

  test('Previous walks back to page 1', async ({ page }) => {
    const next = page.getByRole('button', { name: 'Next' });
    const prev = page.getByRole('button', { name: 'Previous' });
    const indicator = page.getByText(/^Page \d+ \/ \d+$/);
    await next.click();
    await expect(indicator).toContainText(/^Page 2 \/ /);
    await prev.click();
    await expect(indicator).toContainText(/^Page 1 \/ /);
  });
});
