# BÁO CÁO KHẮC PHỤC BẢO MẬT HỆ THỐNG (SECURITY REMEDIATION)
**Dự án**: Digital Secret Letter  
**Nhánh thực hiện**: `fix/qa-audit-remediation`  
**Phiên bản đánh giá**: RC 1.0.0-rc1  
**Ngày lập**: 02/11/2026  

---

## 1. MÔ TẢ CÁC LỖI BẢO MẬT & PHƯƠNG ÁN KHẮC PHỤC

### SEC-01 & SEC-03: Thay thế XOR Obfuscation bằng Chuẩn Mã Hóa AES-256-GCM
- **Rủi ro trước đây**: 
  - Toàn bộ cơ chế mã hóa tĩnh dựa trên phép toán XOR với chuỗi khóa tĩnh `VaultSecretLetter_CoreShield_AESX_9941_K8`.
  - Khóa hardcoded hiển thị trực tiếp trong bundle JavaScript client.
  - Bất kỳ ai kiểm tra Network tab hoặc đọc file mã nguồn đều có thể lấy khóa và giải mã toàn bộ dữ liệu.
- **Phương án khắc phục (Remediation)**:
  - Loại bỏ hoàn toàn XOR làm lớp bảo mật dữ liệu.
  - Chuyển sang chuẩn công nghiệp **AES-256-GCM** tích hợp qua **Web Crypto API** chuẩn W3C (`crypto.subtle`).
  - Sử dụng thuật toán dẫn xuất khóa chuẩn **PBKDF2-SHA256** với **100,000 vòng lặp** và **16-byte cryptographically secure salt**.
  - Mỗi bản ghi mã hóa sở hữu một **12-byte IV ngẫu nhiên duy nhất**, ngăn ngừa tấn công phân tích mẫu thống kê (Replay / Known-Plaintext attack).
  - Không lưu khóa giải mã cùng với ciphertext. Không hardcode passphrase trong frontend.
  - Hỗ trợ tương thích ngược thông minh: Tự động phân biệt phong bì dữ liệu chuẩn v3 với dữ liệu cũ (v1/v2) để phục vụ quá trình migration không mất dữ liệu.

---

### SEC-02 & P0-02: Phân Quyền Đám Mây & Cơ Chế Deny-by-default
- **Rủi ro trước đây**:
  - Firebase Realtime Database mở quyền đọc/ghi công khai (`.read: true, .write: true`).
  - Phân quyền quản trị dựa trên giá trị lưu trong `localStorage` (`admin_token`), dẫn đến nguy cơ người dùng tự sửa LocalStorage trong DevTools để chiếm quyền quản trị (Privilege Escalation).
- **Phương án khắc phục (Remediation)**:
  - Soạn thảo cấu hình bảo mật `database.rules.json` theo nguyên tắc **Mặc định từ chối (Deny-by-default)**:
    - `.read: false`, `.write: false` ở root.
    - `/admin`: Bắt buộc `auth != null && auth.token.role === 'admin'`.
    - `/letters/$letterId`: Kiểm tra quyền đọc theo ngữ cảnh (Người nhận khớp `auth.token.username`, Người gửi khớp `auth.uid`, hoặc cờ `isBroadcast === true`). Thành viên không thể đọc thư riêng của người khác.
    - Chặn đứng hành vi tự phong Admin: Rule xác thực `newData.val() === 'admin'` chỉ được phép khi người thực hiện đang có custom claim `role === 'admin'`.
  - Phía backend Node.js (`server/auth.js`):
    - Áp dụng nguyên tắc **Fail-closed**: Nếu biến môi trường `ADMIN_KEY` chưa được cấu hình, mọi yêu cầu quản trị lập tức bị từ chối với HTTP 503 thay vì mở cửa tự do.
    - So sánh chuỗi thời gian hằng số (`safeCompare` sử dụng `crypto.timingSafeEqual`) để vô hiệu hóa tấn công đo thời gian (Timing Attack).
  - Tuân thủ nguyên tắc an toàn: Không tự ý deploy rules lên Firebase production trước khi hoàn tất kiểm tra và nhận được sự phê duyệt chính thức.

---

### DATA-01 & DATA-02: Chống Ghi Đè Đồng Bộ & Race Conditions
- **Rủi ro trước đây**:
  - File `seed-data.json` có thể ghi đè toàn bộ dữ liệu người dùng khi ứng dụng khởi chạy lần đầu trên máy mới.
  - Hai thiết bị cùng chỉnh sửa 1 bức thư sẽ ghi đè lẫn nhau theo nguyên tắc "Ai ghi sau cùng thì thắng" (Last-Write-Wins), làm mất vĩnh viễn nội dung của người ghi trước.
- **Phương án khắc phục (Remediation)**:
  - **Cold-Start Seed Guard**: `seed-data.json` chỉ được nạp khi cả LocalStorage VÀ Cloud Database đều hoàn toàn rỗng. Khi gặp lỗi mạng, hệ thống chuyển sang chế độ offline an toàn, tuyệt đối không coi lỗi kết nối là bằng chứng cloud rỗng để nạp đè seed.
  - **Atomic Concurrency Control (ETag + If-Match)**: Nâng cấp luồng ghi lên đám mây với header `If-Match: <etag>`. Khi có xung đột ghi đồng thời, server trả về `HTTP 412 Precondition Failed`.
  - **Conflict Forking**: Khi phát hiện xung đột nội dung giữa 2 thiết bị trên cùng 1 lá thư, hệ thống tự động tách bản sao xung đột mang tên `[Bản sao xung đột] [Tên thư]`, đảm bảo 100% không mất chữ của người dùng.
  - **Permanent Deleted IDs Index**: Bổ sung danh mục ID đã xóa vĩnh viễn, ngăn chặn tuyệt đối tình trạng lá thư đã xóa bị hồi sinh khi thiết bị cũ offline 31, 60, 90+ ngày quay lại mạng.

---

## 2. MA TRẬN ĐÁNH GIÁ RỦI RO SAU KHẮC PHỤC

| Mã nguy cơ | Mức độ nghiêm trọng ban đầu | Mức độ nghiêm trọng còn lại | Biện pháp kiểm soát & Kiểm thử |
| :--- | :---: | :---: | :--- |
| **XOR Hardcoded Key** | Critical (P0) | **Negligible (Đã đóng)** | Chuyển sang AES-256-GCM + PBKDF2 (100k iter). Test `P0-03` đạt 100%. |
| **Public Database Write** | Critical (P0) | **Low (Đã kiểm soát)** | Rules deny-by-default, phân quyền theo role/token. Sẵn sàng deploy production khi được duyệt. |
| **Silent Data Overwrite** | Critical (P0) | **Negligible (Đã đóng)** | ETag + If-Match, HTTP 412 retry & Conflict Forking. Test `P0-01` đạt 100%. |
| **Deleted Letter Resurrection** | High (P0) | **Negligible (Đã đóng)** | Permanent Deleted IDs Index. Test offline 31, 60, 90 ngày đạt 100%. |
| **Timing Attack on Admin Key** | Medium (P1) | **Negligible (Đã đóng)** | Sử dụng `crypto.timingSafeEqual` trong `safeCompare`. Test `SEC` đạt 100%. |
