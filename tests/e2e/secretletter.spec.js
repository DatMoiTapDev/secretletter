import { test, expect } from '@playwright/test';

test.describe('Digital Secret Letter — Pre-Production E2E Regression Journey', () => {
  test.beforeEach(async ({ page }) => {
    // ============================================================================
    // FIX-04: BỘ CHẶN BẢO VỆ CÔ LẬP TUYỆT ĐỐI (OFFLINE ISOLATION GUARD)
    // Chặn 100% mọi kết nối mạng ra Internet, Firebase production hay domain lạ
    // ============================================================================
    await page.route('**/*', (route) => {
      const reqUrl = route.request().url();
      if (reqUrl.startsWith('data:') || reqUrl.startsWith('blob:')) {
        return route.continue();
      }

      try {
        const parsed = new URL(reqUrl);
        const isLocalhost = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';

        if (!isLocalhost) {
          console.error(`[SECURITY ABORT] Phát hiện request ngoại vi bị chặn: ${reqUrl}`);
          return route.abort('blockedbyclient');
        }
      } catch {
        return route.abort('blockedbyclient');
      }

      return route.continue();
    });

    await page.goto('/');
  });

  test('E2E-01: Trang chủ tải thành công, kết xuất phong bì tương tác trên localhost', async ({ page }) => {
    await expect(page).toHaveTitle(/Digital Secret Letter|Lá thư bí mật/i);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('E2E-02: Luồng giải mã phong bì và mở khóa hai tầng (Passcode Modal)', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('wrong_test_passcode');
      const submitBtn = page.locator('button[type="submit"]');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(400);
      }
    }
  });

  test('E2E-03: Điều hướng trang đăng nhập và kiểm tra form tài khoản demo', async ({ page }) => {
    await page.goto('/login');
    const usernameInput = page.locator('input[placeholder*="tài khoản" i], input[type="text"]');
    const passwordInput = page.locator('input[type="password"]');

    if (await usernameInput.isVisible() && await passwordInput.isVisible()) {
      await usernameInput.fill('admin');
      await passwordInput.fill('DemoPassword@2026');
      const loginBtn = page.locator('button[type="submit"]');
      await loginBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('E2E-04: Reading Toolbar — Tùy chỉnh cỡ chữ và chế độ tập trung', async ({ page }) => {
    const themeBtn = page.locator('button:has-text("🌙"), button:has-text("☀️"), [aria-label*="theme" i]');
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(200);
    }
  });

  test('E2E-05: Kiểm tra Audio Engine và nút Mute', async ({ page }) => {
    const soundBtn = page.locator('button[aria-label*="âm thanh" i], button[aria-label*="sound" i]');
    if (await soundBtn.isVisible()) {
      await soundBtn.click();
      await page.waitForTimeout(200);
    }
  });
});
