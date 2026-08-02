import { expect, test } from '@playwright/test';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(__dirname, '..', 'fixtures', 'legacy-bitchiko.pdf');

// Persistence relies on localStorage. We can't `addInitScript` to clear it,
// because Playwright re-runs init scripts on reload — that would wipe what we
// are trying to verify. Instead, clear once after the initial page load.
const visitClean = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.goto('/');
};

test.describe('CV persistence in localStorage', () => {
  test('uploaded PDF survives an immediate back-to-landing + reload', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await visitClean(page);

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Upload existing/i }).click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles(FIXTURE);
    await expect(page.getByText(/Bitchiko Tchelidze/).first()).toBeVisible({
      timeout: 60_000,
    });

    // Immediately leave the editor before the 1s autosave debounce fires.
    await page.getByRole('button', { name: /Back to start/i }).click();

    // localStorage must already hold a record — the flush-on-leave path runs
    // synchronously when the editor unmounts.
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = window.localStorage.getItem('freeCvBuilder:savedCvFiles');
          return raw ? (JSON.parse(raw) as unknown[]).length : 0;
        }),
      )
      .toBeGreaterThan(0);

    // After a hard reload the editor should reopen with the uploaded CV.
    await page.reload();
    await expect(page.locator('h1')).toContainText('Bitchiko Tchelidze');
  });

  test('uploaded PDF auto-loads into the editor when the current id matches', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await visitClean(page);

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Upload existing/i }).click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles(FIXTURE);
    await expect(page.getByText(/Bitchiko Tchelidze/).first()).toBeVisible({
      timeout: 60_000,
    });
    // Let the autosave run once.
    await page.waitForTimeout(1500);

    await page.reload();
    // Editor should reopen directly with Bitchiko's CV because
    // freeCvBuilder:currentCvId points at it.
    await expect(page.locator('h1')).toContainText('Bitchiko Tchelidze');
  });

  test('Create-new + edit also persists across reload', async ({ page }) => {
    await visitClean(page);
    await page.getByRole('button', { name: /Create new/i }).click();
    await page.getByRole('button', { name: 'Full name' }).first().click();
    await page
      .getByRole('textbox', { name: 'Full name' })
      .first()
      .fill('Persistent Pat');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.locator('h1')).toContainText('Persistent Pat');
  });
});
