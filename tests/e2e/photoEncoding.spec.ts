import { expect, test } from '@playwright/test';

/**
 * `encodeCanvasAsPhoto` needs a real canvas, so it is exercised in the browser
 * rather than in the node unit suite. It imports the module by source path,
 * which relies on the Playwright webServer being the Vite dev server (it is —
 * see playwright.config.ts); this would need a different hook against a
 * production preview build.
 */
const encodeAndReadCorner = (
  page: import('@playwright/test').Page,
  sourceSize: number,
) =>
  page.evaluate(async (size: number) => {
    const { encodeCanvasAsPhoto } = await import('/src/utils/photo.ts');

    const source = document.createElement('canvas');
    source.width = size;
    source.height = size;
    const ctx = source.getContext('2d')!;
    // An opaque disc on a transparent field — the shape a circular crop makes.
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0000';
    ctx.fill();

    const dataUrl = encodeCanvasAsPhoto(source);

    return new Promise<{ corner: string; mime: string }>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const probe = document.createElement('canvas');
        probe.width = img.width;
        probe.height = img.height;
        const pctx = probe.getContext('2d')!;
        pctx.drawImage(img, 0, 0);
        const [r, g, b] = pctx.getImageData(2, 2, 1, 1).data;
        resolve({
          corner: `rgb(${r},${g},${b})`,
          mime: dataUrl.slice(5, dataUrl.indexOf(';')),
        });
      };
      img.src = dataUrl;
    });
  }, sourceSize);

test.describe('encodeCanvasAsPhoto', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('flattens transparency onto white when downscaling', async ({
    page,
  }) => {
    const { corner, mime } = await encodeAndReadCorner(page, 1200);
    expect(mime).toBe('image/jpeg');
    expect(corner).toBe('rgb(255,255,255)');
  });

  test('flattens transparency onto white when no downscale is needed', async ({
    page,
  }) => {
    // JPEG has no alpha and composites onto black, so a small image must get
    // the same white background as a large one.
    const { corner, mime } = await encodeAndReadCorner(page, 100);
    expect(mime).toBe('image/jpeg');
    expect(corner).toBe('rgb(255,255,255)');
  });
});
