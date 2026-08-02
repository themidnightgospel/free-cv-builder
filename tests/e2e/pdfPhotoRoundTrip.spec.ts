import { expect, test } from '@playwright/test';

/**
 * AGENTS.md requires that uploading a previously exported PDF restores the CV
 * for continued editing. The profile photo is deliberately not part of the
 * embedded JSON payload — it is recovered by reading the image back out of the
 * PDF — so the round trip is only complete if that recovery works.
 */
test.describe('PDF photo round trip', () => {
  test.setTimeout(120_000);

  test('a photo survives export to PDF and re-import', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/');
    await page.getByRole('button', { name: /Create new/i }).click();

    await page.getByRole('button', { name: 'Full name' }).click();
    const name = page.getByRole('textbox', { name: 'Full name' });
    await name.fill('Ada Lovelace');
    await name.press('Enter');

    await page.getByRole('button', { name: 'Email' }).click();
    const email = page.getByRole('textbox', { name: 'Email' });
    await email.fill('ada@example.com');
    await email.press('Enter');

    await page.evaluate(async () => {
      const c = document.createElement('canvas');
      c.width = 900;
      c.height = 900;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 900, 900);
      const blob: Blob = await new Promise((r) =>
        c.toBlob((b) => r(b!), 'image/png'),
      );
      const dt = new DataTransfer();
      dt.items.add(new File([blob], 'p.png', { type: 'image/png' }));
      const el = document.querySelector(
        'input[type="file"][accept="image/*"]',
      ) as HTMLInputElement;
      el.files = dt.files;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.getByRole('button', { name: /Use photo/i }).click();
    await expect(page.locator('img[alt="Ada Lovelace"]')).toBeVisible();

    // page.pdf() renders through the same print stylesheet the export uses.
    const pdf = await page.pdf({ printBackground: true, format: 'A4' });

    await page.getByRole('button', { name: /Back to start/i }).click();
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Upload existing/i }).click();
    (await chooser).setFiles({
      name: 'exported.pdf',
      mimeType: 'application/pdf',
      buffer: pdf,
    });

    // Text restores from the embedded JSON payload.
    await expect(page.getByRole('button', { name: 'Full name' })).toContainText(
      'Ada Lovelace',
      { timeout: 60_000 },
    );

    // The photo has to come back too, or the CV is not really restored.
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              Array.from(document.querySelectorAll('img')).filter((i) =>
                i.src.startsWith('data:'),
              ).length,
          ),
        { timeout: 30_000 },
      )
      .toBeGreaterThan(0);
  });
});
