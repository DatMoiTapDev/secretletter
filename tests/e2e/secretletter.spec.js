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

  test('E2E-01: Trang chủ tải thành công, kết xuất bong bóng chủ đề và Demo Banner', async ({ page }) => {
    await expect(page).toHaveTitle(/Digital Secret Letter|Lá thư bí mật/i);
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Xác minh Demo Banner hiển thị đúng thông tin
    const demoBadge = page.locator('aside[aria-label="Demo status"]');
    await expect(demoBadge).toBeVisible();
    await expect(demoBadge).toContainText(/Portfolio Demo/i);

    // Xác minh 4 bong bóng chủ đề hiện diện trên màn hình
    await expect(page.locator('text=Tết').first()).toBeVisible();
    await expect(page.locator('text=Sinh nhật').first()).toBeVisible();
  });

  test('E2E-02: Luồng giải mã phong bì và mở khóa hai tầng (Passcode / Identifier)', async ({ page }) => {
    // Nhấp chọn một chủ đề để mở Khóa 1 (MultiTierLockFlow)
    const tetBubble = page.locator('text=Tết').first();
    await expect(tetBubble).toBeVisible();
    await tetBubble.click();

    // Xác minh ô nhập tên người nhận (Khóa 1) xuất hiện
    const idInput = page.locator('input[placeholder*="tên" i]');
    await expect(idInput).toBeVisible();
    await idInput.fill('NguoiNhanDemoTest');

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Xác minh assertion thực tế: Hệ thống xử lý và hiển thị thông báo phản hồi (không skip âm thầm)
    const feedback = page.locator('text=Chưa tìm thấy|Không tìm thấy|đang mở|lá thư|chọn');
    await expect(feedback.first()).toBeVisible();
  });

  test('E2E-03: Điều hướng trang đăng nhập và kiểm tra form tài khoản demo với assertion', async ({ page }) => {
    await page.goto('/login');

    const usernameInput = page.locator('input[placeholder*="tên tài khoản" i], input[type="text"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginBtn = page.locator('button[type="submit"]');

    // Assertion bắt buộc: các trường form phải render đầy đủ
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginBtn).toBeVisible();

    // Thử đăng nhập với mật khẩu sai để kiểm tra phản hồi lỗi thực tế
    await usernameInput.fill('admin');
    await passwordInput.fill('WrongPasswordTest999');
    await loginBtn.click();

    // Assertion bắt buộc: thông báo lỗi xác thực phải hiển thị
    const errorAlert = page.locator('text=Mật khẩu không chính xác|Sai tài khoản|lỗi|thất bại');
    await expect(errorAlert.first()).toBeVisible();
  });

  test('E2E-04: Header Controls — Chuyển đổi giao diện Sáng / Tối (Dark Mode Toggle)', async ({ page }) => {
    await page.goto('/');

    const themeBtn = page.locator('button[title*="Nền Tối"], button[title*="Nền Sáng"]');
    await expect(themeBtn).toBeVisible();

    const initialText = await themeBtn.innerText();
    await themeBtn.click();

    // Assertion bắt buộc: Giao diện phải thay đổi trạng thái sau khi click
    await expect(themeBtn).not.toHaveText(initialText);
  });

  test('E2E-05: Header Controls — Kiểm tra Audio Engine và nút Mute', async ({ page }) => {
    await page.goto('/');

    const soundBtn = page.locator('button[title*="âm thanh"]');
    await expect(soundBtn).toBeVisible();

    const initialTitle = await soundBtn.getAttribute('title');
    await soundBtn.click();

    // Assertion bắt buộc: Trạng thái âm thanh phải thay đổi (toggle mute/unmute)
    await expect(soundBtn).not.toHaveAttribute('title', initialTitle || '');
  });
});
