import { test } from '@playwright/test';

// Records a short ~10-second walkthrough of the app for the README.
// Run via `npm run demo:record` — encodes MP4 + GIF into demo/.
test('readme demo: landing → create CV → fill info → download', async ({
  page,
}) => {
  // Suppress the native print dialog so the demo doesn't pause at the end.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'print', {
      value: () => {},
      configurable: true,
    });
    window.localStorage.clear();
  });

  await page.goto('/');
  await page.waitForTimeout(900);

  await page.getByRole('button', { name: /Create new/i }).click();
  await page.waitForTimeout(700);

  await page.getByRole('button', { name: 'Full name' }).click();
  await page
    .getByRole('textbox', { name: 'Full name' })
    .pressSequentially('Ada Lovelace', { delay: 40 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);

  await page.getByRole('button', { name: 'Job title' }).click();
  await page
    .getByRole('textbox', { name: 'Job title' })
    .pressSequentially('Computing Pioneer', { delay: 30 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);

  await page.getByRole('button', { name: 'Email' }).click();
  await page
    .getByRole('textbox', { name: 'Email' })
    .pressSequentially('ada@example.com', { delay: 30 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);

  await page.getByRole('button', { name: /\+ Add experience/i }).click();
  const popover = page.locator('[role="dialog"]');
  await popover.getByLabel('Job title').pressSequentially('Analyst', {
    delay: 30,
  });
  await popover
    .getByLabel('Company')
    .pressSequentially('Analytical Engine Co', { delay: 25 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);

  await page.getByRole('button', { name: /Download PDF/i }).click();
  // The native print dialog can't be recorded — surface the in-app toast that
  // mentions "Save as PDF" instead, then hold so the viewer can read it.
  await page
    .getByText(/Save as PDF/i)
    .first()
    .waitFor({ state: 'visible' });
  await page.waitForTimeout(2200);
});
