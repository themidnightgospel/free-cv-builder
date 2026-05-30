import { expect, test } from '@playwright/test';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(__dirname, '..', 'fixtures', 'legacy-bitchiko.pdf');

test.describe('Legacy PDF import', () => {
  test.setTimeout(90_000);

  test('uploads a CV exported from a previous version and lands in the editor', async ({
    page,
  }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Upload existing CV/i }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(FIXTURE);
    await expect(
      page.getByRole('button', { name: /Download PDF/i }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByText(/Bitchiko Tchelidze/).first(),
    ).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByText(/Senior \.NET Software Engineer/).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/Software Architect/).first(),
    ).toBeVisible();
  });
});
