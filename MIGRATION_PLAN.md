# KẾ HOẠCH NÂNG CẤP & DI CHUYỂN DỮ LIỆU AN TOÀN (MIGRATION PLAN)
**Dự án**: Digital Secret Letter  
**Từ phiên bản**: Schema v1 / v2 (XOR Legacy)  
**Lên phiên bản**: Schema v3 (AES-256-GCM + OCC + Permanent Deleted IDs)  
**Trạng thái hiện tại**: **CHƯA THỰC THI TRÊN PRODUCTION (DRY-RUN ONLY)**  

---

## 1. MỤC TIÊU & NGUYÊN TẮC BẢO TOÀN DỮ LIỆU

1. **Bảo tồn nguyên vẹn 100% dữ liệu**: Không làm mất bất kỳ lá thư, ảnh kỷ niệm, mật mã hay tài khoản người dùng hiện hữu.
2. **Khả năng tương thích ngược hoàn chỉnh (Bi-directional Compatibility)**: Bộ giải mã v3 tự động nhận dạng phong bì v3 lẫn chuỗi cipher cũ v1/v2.
3. **Thử nghiệm khô (Dry-Run Testing)**: Toàn bộ quá trình di chuyển phải được kiểm tra ngoại tuyến trên bản sao lưu dữ liệu thực tế trước khi áp dụng lên đám mây.
4. **Không tự ý di chuyển Production**: Việc cập nhật dữ liệu trên Firebase Realtime Database production chỉ được phép tiến hành sau khi có phê duyệt chính thức bằng văn bản.

---

## 2. QUY TRÌNH THỰC HIỆN THỬ NGHIỆM KHÔ (DRY-RUN PROCEDURE)

### Bước 1: Sao lưu & Xác thực tính toàn vẹn (Backup & Integrity Hash)
- Tải toàn bộ dữ liệu raw và decrypted về thư mục ngoại tuyến `backups/`:
  - `backups/firebase_vault_backup_raw_<timestamp>.json`
  - `backups/firebase_vault_backup_decrypted_<timestamp>.json`
- Tính toán mã băm SHA-256 của file backup gốc để làm căn cứ đối chiếu:
  ```bash
  node -e "const fs = require('fs'); const crypto = require('crypto'); console.log(crypto.createHash('sha256').update(fs.readFileSync('backups/firebase_vault_backup_decrypted_1762103444000.json')).digest('hex'));"
  ```

### Bước 2: Chạy thử nghiệm Migration trên Staging (Dry-Run Execution)
Sử dụng hàm chuẩn hóa `migrateToV3Payload` trong `client/src/api/syncEngine.js`:
```javascript
// Nạp dữ liệu backup đã giải mã
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Thực hiện nâng cấp khô sang Schema v3
const migratedData = migrateToV3Payload(backupData);

// Xác minh các chỉ số kiểm toán:
assert.strictEqual(migratedData.schemaVersion, 3);
assert.strictEqual(migratedData.users.length, backupData.users.length);
assert.strictEqual(migratedData.letters.length, backupData.letters.length);
```

### Bước 3: Đối chiếu nội dung từng lá thư (Content Parity Audit)
Đối chiếu từng trường dữ liệu của từng lá thư trước và sau migration:
- Tiêu đề (`title`)
- Lời chào (`greeting`)
- Các đoạn văn tâm thư (`paragraphs`)
- Album ảnh (`photos`)
- Điều chưa nói (`secretUnsaid`)
- Quà tặng kỹ thuật số (`gift`)
- Mật khẩu mở thư (`password` & `passwordHint`)

---

## 3. QUẢN LÝ VÒNG ĐỜI KHÓA (KEY MIGRATION LIFECYCLE)

| Giai đoạn | Cơ chế mã hóa | Vị trí khóa | Xử lý khi người dùng mất khóa |
| :--- | :--- | :--- | :--- |
| **Legacy (v1/v2)** | XOR Obfuscation | Hardcoded key trong frontend | Khôi phục tự động qua hàm giải mã tương thích ngược |
| **Hiện đại (v3)** | AES-256-GCM + PBKDF2 (100k iter) | Dẫn xuất từ mật mã do người gửi đặt | **Không thể khôi phục** nếu mất mật mã (Zero-Knowledge Passphrase) |

> [!WARNING] Giới hạn thiết kế bảo mật quan trọng
> Trong chuẩn Schema v3, nếu người gửi quên mật mã mở thư, nội dung thư sẽ **không thể khôi phục** bởi bất kỳ ai (kể cả Quản trị viên). Thiết kế này nhằm hạn chế tối đa việc truy cập trái phép vào bức thư tâm tình của người dùng.

---

## 4. XỬ LÝ DỮ LIỆU BẤT THƯỜNG HOẶC KHÔNG TƯƠNG THÍCH

Nếu gặp bản ghi hỏng hoặc cấu trúc không hợp lệ trong quá trình migration:
1. Bản ghi lỗi không bị xóa mà được cô lập vào mảng `quarantine_records` kèm lý do lỗi.
2. Hệ thống phát tín hiệu cảnh báo đến Creator Studio để quản trị viên kiểm tra thủ công.
3. Toàn bộ các bản ghi hợp lệ còn lại tiếp tục được di chuyển bình thường mà không bị gián đoạn.

---

## 5. KẾ HOẠCH HOÀN NGUYÊN MIGRATION (MIGRATION ROLLBACK)

Nếu quá trình migration trên staging phát hiện sai lệch dữ liệu:
1. Dừng ngay lập tức quy trình.
2. Giữ nguyên dữ liệu hiện tại trên Firebase Realtime Database.
3. Kiểm tra nhật ký lỗi trong `server/tests/p0_final_remediation.test.js` để xác định nguyên nhân.
4. Điều chỉnh hàm ánh xạ và thực hiện lại Dry-Run cho đến khi đạt 100% khớp dữ liệu.
