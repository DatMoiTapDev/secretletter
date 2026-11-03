# DANH MỤC KIỂM TRA PHÁT HÀNH (RELEASE CHECKLIST)
**Phiên bản**: Release Candidate 1.0.0-rc1  
**Nhánh làm việc**: `fix/qa-audit-remediation`  
**Ngày kiểm toán**: 02/11/2026  
**Trạng thái**: Chờ phê duyệt nghiệm thu (Awaiting Final GO/NO-GO)  

---

## 1. KIỂM SOÁT MÃ NGUỒN & NHÁNH (GIT & REPO INTEGRITY)

- [x] Làm việc độc lập trên nhánh `fix/qa-audit-remediation`.
- [x] Không push lên remote repository (`origin`).
- [x] Không merge vào nhánh `main`.
- [x] Không deploy lên GitHub Pages (`gh-pages`) hoặc Firebase Hosting.
- [x] Thư mục `backups/` nằm trong `.gitignore` và chưa từng xuất hiện trong lịch sử Git.
- [x] Đã quét tĩnh toàn bộ bundle trong `dist/assets/`, xác nhận **không có khóa bí mật, API key nhạy cảm hay mật khẩu nào bị hardcode**.

---

## 2. CHẤT LƯỢNG MÃ & KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITES)

- [x] Toàn bộ **51/51 kịch bản kiểm thử tự động** chạy thành công qua `npm test` trong 521ms:
  - `p0_rc1_1_firebase_auth_emulator.test.js`: 9 tests (Kiểm thử thực thi trực tiếp trên Firebase Auth & RTDB Emulator).
  - `p0_sync_security.test.js`: 9 tests.
  - `p0_final_remediation.test.js`: 10 tests.
  - `p0_rc1_blocker_verification.test.js`: 7 tests.
  - `p0_e2e_integration_regression.test.js`: 5 tests.
  - `p1_performance_multidevice.test.js`: 4 tests.
  - `p2_ui_reading_experience.test.js`: 6 tests.
- [x] Kiểm thử toàn bộ 5 Blockers và RC1.1:
  - Firebase Custom Token (RS256) $\rightarrow$ Firebase ID Token $\rightarrow$ REST API `?auth=`.
  - Security Rules nạp trực tiếp file `database.rules.json` thực thi: Từ chối Anonymous, cách ly Member A/B, cấp quyền Admin qua Custom Claim, chặn nâng quyền DevTools.
  - AES-256-GCM AEAD tamper resistance, Safe Rollback delta restore, Tombstone 90 days retention.
- [x] Ghi nhận minh bạch về E2E: Đã kiểm thử tự động toàn diện trên Node.js Runner mô phỏng DOM/SubtleCrypto hai browser contexts. Ghi nhận kiểm thử giao diện thực tế trên thiết bị vật lý iOS Safari / Android Chrome để QA thực hiện thủ công trước khi phát hành.

---

## 3. BẢO MẬT & PHÂN QUYỀN ĐÁM MÂY (SECURITY & CLOUD RULES)

- [x] Cấu hình `database.rules.json` đã được soạn thảo theo nguyên tắc Deny-by-default (`.read: false, .write: false`).
- [x] Phân quyền phân tách rõ rệt: Master Admin (`auth.token.role === 'admin'`) và Member.
- [x] Thành viên không thể đọc thư riêng của người khác và không thể tự cấp quyền admin.
- [x] Tuân thủ cam kết: **Chưa deploy Security Rules lên Firebase Production** khi chưa có phê duyệt chính thức.

---

## 4. DỮ LIỆU & NÂNG CẤP SCHEMA (DATA INTEGRITY)

- [x] Bản sao lưu dữ liệu nguyên bản và bản giải mã được lưu trữ an toàn trong `backups/`.
- [x] Cơ chế `seed-data.json` bị chặn không thể ghi đè dữ liệu thật của người dùng.
- [x] Schema v3 hỗ trợ tương thích ngược giải mã hoàn hảo dữ liệu cũ v1/v2 mà không làm mất thư.
- [x] Cơ chế Conflict Forking tự động bảo tồn cả hai phiên bản nếu hai thiết bị sửa cùng lúc.

---

## 5. ĐÓNG GÓI & TỐI ƯU HÓA PRODUCTION BUILD

- [x] Lệnh đóng gói `npm run build` thực thi thành công không lỗi (Code 0).
- [x] Kích thước bundle chính giảm từ 491.71 kB xuống 327.12 kB (Gzip ~94.5 kB).
- [x] Toàn bộ các trang Creator Studio và Member Dashboard đã được phân tách thành lazy chunks độc lập.
- [x] Đã áp dụng rule CSS `16px` chống iOS Safari auto-zoom khi focus input.

---

## 6. QUYẾT ĐỊNH PHÁT HÀNH (GO / NO-GO SIGN-OFF)

- [ ] **Phê duyệt của Chủ quản dự án (Product Owner / Lead)**:
  - Quyết định: **[ ] GO for Production    [ ] NO-GO**
  - Chữ ký / Xác nhận: ________________________
  - Ngày phê duyệt: ________________________
