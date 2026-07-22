import { defineConfig, devices } from '@playwright/test';

const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const port = process.env.PLAYWRIGHT_PRODUCTION_PORT ?? '4173';
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  testMatch: 'production-build.spec.ts',
  timeout: 30_000,
  reporter: 'list',
  use: { baseURL },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'chromium-production',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExecutablePath
          ? { launchOptions: { executablePath: chromiumExecutablePath } }
          : {}),
      },
    },
  ],
});
