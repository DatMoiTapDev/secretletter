import { defineConfig, devices } from '@playwright/test';

/**
 * Cấu hình Playwright phục vụ Pre-Production E2E Verification
 * Đáp ứng FIX-03 (Đồng bộ cổng và chỉ chạy frontend Vite) và FIX-04 (Cách ly test)
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  webServer: {
    // FIX-03: Chỉ chạy dev frontend của Vite trên cổng 5173 cố định, không khởi chạy backend ngoài ý muốn
    command: 'npm run dev:client -- --port 5173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 45000,
    env: {
      VITE_E2E_TEST_MODE: 'true',
      VITE_API_BASE_URL: 'http://127.0.0.1:5173'
    }
  }
});
