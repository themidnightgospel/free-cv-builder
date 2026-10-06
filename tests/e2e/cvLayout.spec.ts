import { expect, test, type Page } from '@playwright/test';

const WEBSITE = 'https://www.toptal.com/developers/resume/someone';

const seedCv = {
  personalInfo: {
    fullName: 'Ada Lovelace',
    jobTitle: 'Engineer',
    summary: '',
    email: 'ada@example.com',
    phone: '',
    location: 'London',
    website: WEBSITE,
    linkedin: 'https://www.linkedin.com/in/ada-lovelace/',
  },
  experience: [],
  education: [],
  projects: [],
  achievements: [],
  publications: [],
  talks: [],
  volunteer: [],
  openSource: [],
  skills: [
    { id: 'skill-1', name: 'C#' },
    { id: 'skill-2', name: 'Orleans' },
  ],
  languages: [],
  customSections: [],
  sectionsOrder: ['personal', 'skills'],
};

// Seed after the first load rather than via addInitScript, which would re-run
// on every navigation (see persistence.spec.ts).
const openSeededCv = async (page: Page) => {
  await page.goto('/');
  await page.evaluate((cv) => {
    window.localStorage.clear();
    window.localStorage.setItem(
      'freeCvBuilder:savedCvFiles',
      JSON.stringify([
        { id: 'seeded', name: 'Ada Lovelace', updatedAt: Date.now(), cv },
      ]),
    );
    window.localStorage.setItem('freeCvBuilder:currentCvId', 'seeded');
  }, seedCv);
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Ada Lovelace');
};

const openPrintLayout = async (page: Page) => {
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.getByRole('button', { name: /Download PDF/i }).click();
  const printLayout = page.locator('div.hidden.print\\:block[aria-hidden="true"]');
  await printLayout.waitFor({ state: 'attached' });
  return printLayout;
};

test.describe('CV layout', () => {
  test('skills sit side by side instead of one per line', async ({ page }) => {
    await openSeededCv(page);
    const first = await page.getByText('C#', { exact: true }).boundingBox();
    const second = await page
      .getByText('Orleans', { exact: true })
      .boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs(first!.y - second!.y)).toBeLessThan(2);
  });

  test('header links show the domain but still point to the full address', async ({
    page,
  }) => {
    await openSeededCv(page);
    const printLayout = await openPrintLayout(page);
    const portfolio = printLayout.locator(`a[href="${WEBSITE}"]`);
    await expect(portfolio).toHaveText('toptal.com');
    const linkedin = printLayout.locator('a[href*="linkedin.com/in/ada"]');
    await expect(linkedin).toHaveText('linkedin.com');
  });
});
