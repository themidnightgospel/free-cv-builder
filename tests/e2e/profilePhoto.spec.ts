import { expect, test } from '@playwright/test';

/**
 * A cropped photo is stored inside the CV record in localStorage, which has a
 * ~4MB ceiling. Encoding the crop at full source resolution overflows it, the
 * write fails, and the user's work stops persisting.
 */
const PHOTO_DATA_URL_BUDGET_BYTES = 400_000;

/** Feeds a large, high-entropy image through the real photo upload input. */
const uploadLargePhoto = (page: import('@playwright/test').Page) =>
  page.evaluate(async () => {
    const SOURCE = 2000;
    const canvas = document.createElement('canvas');
    canvas.width = SOURCE;
    canvas.height = SOURCE;
    const ctx = canvas.getContext('2d')!;
    const image = ctx.createImageData(SOURCE, SOURCE);
    // Noise, so the encoder cannot compress this away — a real photo behaves
    // much closer to this than to a flat gradient.
    for (let i = 0; i < image.data.length; i += 4) {
      image.data[i] = Math.random() * 255;
      image.data[i + 1] = Math.random() * 255;
      image.data[i + 2] = Math.random() * 255;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png'),
    );
    const file = new File([blob], 'photo.png', { type: 'image/png' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const input = document.querySelector(
      'input[type="file"][accept="image/*"]',
    ) as HTMLInputElement;
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

const setFullName = async (
  page: import('@playwright/test').Page,
  value: string,
) => {
  await page.getByRole('button', { name: 'Full name' }).click();
  const input = page.getByRole('textbox', { name: 'Full name' });
  await input.fill(value);
  await input.press('Enter');
};

const storedPhoto = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const raw = window.localStorage.getItem('freeCvBuilder:savedCvFiles');
    if (!raw) return null;
    const records = JSON.parse(raw) as Array<{
      cv: { personalInfo: { photoDataUrl: string | null } };
    }>;
    return records[0]?.cv?.personalInfo?.photoDataUrl ?? null;
  });

test.describe('Profile photo', () => {
  // Generating and encoding a multi-megapixel image is slow on CI runners.
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    // Clear once after load rather than via addInitScript, which Playwright
    // re-runs on reload and would wipe the state under test.
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/');
    await page.getByRole('button', { name: /Create new/i }).click();
  });

  test('a large photo is downscaled before it is stored', async ({ page }) => {
    await setFullName(page, 'Ada Lovelace');
    await uploadLargePhoto(page);
    await page.getByRole('button', { name: /Use photo/i }).click();

    await expect(page.locator('img[alt="Ada Lovelace"]')).toBeVisible();

    // Poll rather than sleep past the 1s autosave debounce.
    await expect
      .poll(async () => (await storedPhoto(page))?.length ?? 0, {
        timeout: 15_000,
      })
      .toBeGreaterThan(0);

    const photo = await storedPhoto(page);
    expect(photo!.length).toBeLessThan(PHOTO_DATA_URL_BUDGET_BYTES);
  });

  test('edits made after adding a photo survive a reload', async ({ page }) => {
    await uploadLargePhoto(page);
    await page.getByRole('button', { name: /Use photo/i }).click();
    await expect(page.locator('img[alt="Profile photo"]')).toBeVisible();

    await setFullName(page, 'Ada Lovelace');

    // The edit must reach storage before we reload, or we prove nothing.
    await expect
      .poll(
        async () =>
          page.evaluate(() =>
            (
              window.localStorage.getItem('freeCvBuilder:savedCvFiles') ?? ''
            ).includes('Ada Lovelace'),
          ),
        { timeout: 15_000 },
      )
      .toBe(true);

    await page.reload();

    // The editor must come back with the work intact, not drop to the landing page.
    await expect(
      page.getByRole('button', { name: /Download PDF/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Full name' }),
    ).toContainText('Ada Lovelace');
    expect(await storedPhoto(page)).not.toBeNull();
  });
});
