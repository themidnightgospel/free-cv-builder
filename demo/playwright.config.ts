import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 5174);
const BASE_URL = `http://localhost:${PORT}`;

// Separate config used only when recording the README demo. Keeps the regular
// e2e suite (which runs in CI) fast and headless without per-test video output.
export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: BASE_URL,
    actionTimeout: 10_000,
    video: {
      mode: 'on',
      // Match the viewport so the captured video has no letterboxing.
      size: { width: 1280, height: 800 },
    },
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: `npx vite --port ${PORT} --host 127.0.0.1 --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
