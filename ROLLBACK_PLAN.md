# PHƯƠNG ÁN KHÔI PHỤC VÀ HOÀN NGUYÊN AN TOÀN (SAFE ROLLBACK PLAN)
**Dự án**: Digital Secret Letter  
**Nhánh khôi phục**: `fix/qa-audit-remediation` $\rightarrow$ `main`  
**Phiên bản áp dụng**: RC 1.0.0-rc1  
**Mục tiêu**: Đảm bảo hoàn nguyên hệ thống về trạng thái ổn định trong vòng 5 phút mà không gây mất lịch sử Git và không ghi đè dữ liệu mới phát sinh.

---

## 1. NGUYÊN TẮC AN TOÀN BẮT BUỘC (SAFETY PRINCIPLES)

1. **Tuyệt đối không dùng `git reset --hard`**: Mọi thao tác hoàn nguyên mã nguồn phải sử dụng `git revert` để tạo commit đảo ngược an toàn, bảo toàn 100% lịch sử commit và dấu vết kiểm toán (Audit Trail).
2. **Không ghi đè mù toàn bộ Database**: Khi hoàn nguyên cơ sở dữ liệu Firebase Production, không được dùng lệnh PUT đè toàn bộ file backup cũ nếu đã có dữ liệu mới phát sinh sau thời điểm backup. Phải áp dụng cơ chế **Khôi phục vi sai có chọn lọc (Selective Delta Restore)**.
3. **Phân tách 4 tầng hoàn nguyên độc lập**: Mã nguồn (Code), Cơ sở dữ liệu (Database), Cấu trúc (Schema), và Quy tắc phân quyền (Security Rules) phải có quy trình xử lý riêng biệt.
4. **Phê duyệt bắt buộc**: Mọi thao tác ghi dữ liệu hoàn nguyên lên production phải được xác nhận bằng văn bản bởi Chủ quản dự án.

---

## 2. QUY TRÌNH HOÀN NGUYÊN 4 TẦNG ĐỘC LẬP

### Tầng 1: Hoàn nguyên Mã nguồn Client (Safe Code Rollback via `git revert`)
Nếu bản phát hành trên GitHub Pages hoặc máy chủ gặp sự cố:
```bash
# 1. Xác định commit hash gây lỗi trên nhánh main
git log --oneline -n 5

# 2. Tạo commit hoàn nguyên an toàn (không làm mất lịch sử git)
git revert <commit-hash-loi> -m 1 --no-edit

# 3. Đóng gói lại bản build ổn định
npm ci
npm run build

# 4. Triển khai bản build an toàn lên hosting
# (Chỉ thực hiện sau khi có phê duyệt)
```
*Thời gian thực hiện ước tính*: **2 - 3 phút**.

---

### Tầng 2: Hoàn nguyên Cơ sở dữ liệu Đám mây (Selective Delta Database Restore)
Nếu dữ liệu trên Firebase Realtime Database bị xung đột hoặc lỗi:
1. **Kiểm tra dữ liệu phát sinh mới**:
   - Tải bản snapshot hiện tại trên Firebase: `GET /vault_data.json`.
   - Đối chiếu danh sách thư với bản backup gần nhất trong `backups/firebase_vault_backup_raw_<timestamp>.json`.
2. **Trích xuất các bản ghi mới (Delta Extraction)**:
   - Nếu có các lá thư mới được người dùng tạo sau thời điểm backup, trích xuất riêng các thư này để bảo vệ.
3. **Thực hiện Selective Merge & Restore**:
   - Hợp nhất dữ liệu backup với các thư mới phát sinh thông qua hàm `mergeLetters` và `mergeUsers`.
   - Mã hóa lại bằng chuẩn tương thích và đẩy lên server kèm ETag mới.
   - Tuyệt đối không xóa hay ghi đè mù làm mất các lá thư vừa gửi.
*Thời gian thực hiện ước tính*: **3 - 5 phút**.

---

### Tầng 3: Hoàn nguyên Cấu trúc Schema (Schema Version Fallback)
Nếu Schema v3 gặp lỗi không lường trước trên client:
1. Nhờ thiết kế tương thích ngược trong `syncEngine.js`, client v2 và client v3 có thể đọc hiểu cả hai định dạng (v2 XOR và v3 AES-GCM).
2. Đặt lại biến cờ môi trường `VAULT_FALLBACK_SCHEMA = 2` trên client để chuyển hướng bộ ghi về chuẩn v2 mà không làm gián đoạn việc giải mã các thư đã tạo ở chuẩn v3.

---

### Tầng 4: Hoàn nguyên Firebase Security Rules
Nếu quy tắc bảo mật mới chặn nhầm các yêu cầu hợp lệ của người dùng:
1. Sử dụng công cụ Firebase CLI để khôi phục file rules hoạt động trước đó:
   ```bash
   firebase deploy --only database:rules
   ```
2. Hoặc truy cập **Firebase Console $\rightarrow$ Realtime Database $\rightarrow$ Rules History**, chọn bản rules ổn định gần nhất và nhấn **Restore**.

---

## 3. CHECKLIST XÁC NHẬN SAU KHI HOÀN NGUYÊN (POST-ROLLBACK VERIFICATION)
- [ ] Truy cập đường dẫn trang chủ, xác nhận giao diện hiển thị bình thường.
- [ ] Đăng nhập tài khoản Master Admin thành công.
- [ ] Đăng nhập tài khoản Member thành công.
- [ ] Mở thử 1 lá thư bất kỳ có mật mã, xác nhận mở khóa bình thường.
- [ ] Gửi thử 1 lá thư mới, xác nhận lưu trữ và đồng bộ thành công.
