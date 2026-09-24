# 🚀 SỔ TAY THƯƠNG MẠI HÓA & TRIỂN KHAI NỀN TẢNG DIGITAL SECRET LETTER

Tài liệu này cung cấp toàn bộ hướng dẫn vận hành, cấu hình thương hiệu, bảo mật, và quy trình triển khai ứng dụng **Digital Secret Letter** thành một sản phẩm kinh doanh số (Digital Gift SaaS / Digital Stationery) hoàn chỉnh.

---

## 1. Tổng Quan Sản Phẩm & Mô Hình Kinh Doanh

**Digital Secret Letter** là nền tảng quà tặng kỹ thuật số cao cấp, mang lại trải nghiệm cảm xúc độc bản với:
- 🫧 **Giao diện Bong bóng nổi (Vibe Hub)**: 8 không gian cảm xúc chuẩn mực gồm **4 Nền Sáng ☀️** và **4 Nền Tối 🌙**.
- 🔒 **Hệ thống bảo mật 2 tầng**:
  - **Khóa 1**: Định danh người nhận bằng Tên hoặc Mã bí mật (hoàn toàn ẩn danh, không lộ danh sách).
  - **Khóa 2**: Người nhận tự do chọn chiếc khóa mình muốn mở và nhập mật mã riêng.
- ✉️ **Phong bì 3D tương tác**: Hoạt ảnh bóc niêm phong sáp chân thực, tỏa sáng kỳ diệu và trồi lá thư lên mượt mà.
- 📜 **Trang giấy thư cao cấp**: Đầy đủ đoạn văn tâm sự, danh ngôn nổi bật, bộ sưu tập ảnh Polaroid kỷ niệm, mục "Điều chưa nói" (Secret Unsaid) và "Điều cuối cùng" (Final Thought).
- 🎵 **Hệ thống âm thanh Synthesizer độc quyền**: Phát nhạc nền cảm xúc tự động (holiday bells, dreamy piano, midnight lofi, acoustic, ambient...) không phụ thuộc link ngoài.
- 📱 **Chia sẻ mã QR phong cách Desktop**: Cửa sổ thu nhỏ (`—`), phóng to (`❐`) và đóng (`✕`) chuẩn chỉnh.

### 💡 Các Mô Hình Kinh Doanh Tiềm Năng:
1. **Dịch vụ tạo thiệp số / thư tỏ tình / kỷ niệm cá nhân hóa**:
   - Thu phí từ **49.000đ - 199.000đ** cho mỗi lá thư bí mật gửi tặng kèm mã QR in lên thiệp giấy, quà tặng, hoa hoặc gấu bông.
2. **Kinh doanh theo mùa sự kiện**:
   - Mùa Tốt nghiệp / Kỷ yếu.
   - Mùa Giáng sinh & Năm mới (Noel & Tết).
   - Ngày Lễ Tình Nhân (Valentine 14/2), Ngày Phụ Nữ (8/3, 20/10), Sinh nhật.
3. **White-label Agency**:
   - Tùy biến thương hiệu cho doanh nghiệp gửi thư tri ân khách hàng VIP, thiệp mời đám cưới điện tử tương tác cao cấp.

---

## 2. Cấu Trúc Khung Trắng (Clean Boilerplate)

Hệ thống hiện tại là một **Bản Khung Trắng Hoàn Chỉnh (Clean Slate)**, đã dọn sạch toàn bộ dữ liệu mẫu/test:
- `data/vibeStore.json`: Chứa sẵn cấu trúc 8 chủ đề (4 Sáng, 4 Tối) với danh sách người nhận trống (`recipients: []`).
- `data/letters.json`: Mảng thư rỗng (`[]`).
- `uploads/`: Sẵn sàng tiếp nhận ảnh và âm thanh tải lên của khách hàng.
- Không còn bất kỳ script nạp dữ liệu mẫu nào tự động chạy khi khởi động server.

---

## 3. Cấu Hình Môi Trường & Mật Khẩu Quản Trị (.env)

Trong thư mục gốc của dự án, bạn có tệp `.env`. Hãy mở và cập nhật theo thông tin của bạn:

```env
# Cổng chạy Backend (mặc định: 5000)
PORT=5000

# MẬT KHẨU QUẢN TRỊ MASTER KEY (CREATOR STUDIO)
# Hãy đổi thành mật khẩu an toàn của riêng bạn trước khi đưa lên mạng!
ADMIN_KEY=your_secure_password_here

# Tên thương hiệu hiển thị
APP_NAME=Digital Secret Letter
```

> [!IMPORTANT]
> Mật khẩu quản trị (`ADMIN_KEY`) là chìa khóa bảo mật để bạn truy cập vào Creator Studio tại địa chỉ `/admin`. Bất cứ khi nào bạn thay đổi biến này trong `.env`, hãy khởi động lại server để có hiệu lực.

---

## 4. Hướng Dẫn Vận Hành Creator Studio (`/admin`)

Truy cập đường dẫn: **`http://yourdomain.com/admin`** (hoặc `http://localhost:3000/admin`).

### Bước 1: Đăng nhập
- Nhập mật khẩu quản trị đã cấu hình trong `.env` (hoặc mật khẩu mặc định `secretadmin2026`).

### Bước 2: Tạo Thư Cho Khách Hàng

Có 2 cách phát hành thư:

#### Cách 1: Phát hành qua Hệ thống Bong Bóng Vibe Hub (Khóa 2 Tầng)
1. Trong tab **"Quản Lý Vibe Hub"**, chọn 1 trong 8 chủ đề (Ví dụ: *Ngọt Ngào Dễ Thương*, *Sinh Nhật*, *Giáng Sinh*...).
2. Bấm **"Thêm Người Nhận Mới"**:
   - Nhập **Tên người nhận** (Ví dụ: `Linh Chi`, `Anh Quân`).
   - Nhập **Bí danh nhận diện (Aliases)** (cách nhau bởi dấu phẩy, ví dụ: `linh chi, linh, bé heo`). Người nhận gõ bất kỳ từ nào trong danh sách này đều sẽ mở được khóa 1.
3. Trong thẻ của người nhận đó, bấm **"Thêm Khóa / Lá Thư Mới"**:
   - Chọn biểu tượng chìa khóa (🗝️, 💌, 🎁, 💎...).
   - Đặt tiêu đề khóa (Ví dụ: *Khóa 1: Lời nhắn sinh nhật*, *Khóa 2: Kỷ niệm Đà Lạt*).
   - Đặt **Mật khẩu chiếc khóa này (Khóa 2)** và **Gợi ý mật khẩu**.
   - Soạn tiêu đề, lời mở đầu, các đoạn văn, hình ảnh kỷ niệm, điều chưa nói và lời chúc cuối cùng.
   - Bấm **"Lưu Lá Thư Này"**.

#### Cách 2: Phát hành qua Thư Đường Link Riêng Biệt (`/letter/:slug`)
1. Chuyển sang tab **"Thư Đường Dẫn Trực Tiếp"**.
2. Bấm **"Tạo Thư Link Riêng"** để mở trình biên tập Creator Studio toàn diện:
   - Tùy chỉnh URL thân thiện (Slug).
   - Tải ảnh, chọn hiệu ứng Canvas, tải nhạc MP3 hoặc chọn bài nhạc có sẵn.
   - Tạo mã QR tức thì để in ra thiệp hoặc gửi qua Zalo/Messenger/Instagram.

---

## 5. Các Lệnh Tiện Ích Vận Hành (CLI Scripts)

Dự án tích hợp sẵn các lệnh vận hành chuẩn trong `package.json`:

| Lệnh | Ý nghĩa | Khi nào sử dụng |
|---|---|---|
| `npm run dev` | Khởi chạy đồng thời cả Backend (port 5000) và Frontend (port 3000) | Trong quá trình phát triển cục bộ |
| `npm run build` | Đóng gói mã nguồn Frontend sang thư mục `dist/` | Trước khi triển khai lên máy chủ thật |
| `npm start` | Khởi động server production (phục vụ cả API và giao diện tĩnh) | Chạy trên môi trường máy chủ / VPS |
| `npm run reset:clean` | **Làm sạch 1 chạm**: Đưa toàn bộ database và file upload về khung trắng | Khi bạn muốn xóa sạch mọi dữ liệu test để bắt đầu kinh doanh mới |
| `npm run seed:demo` | Nạp bộ dữ liệu mẫu thực tế (demo 8 chủ đề) | Khi bạn muốn có sẵn dữ liệu để quay video, chụp ảnh quảng cáo chào hàng |

---

## 6. Hướng Dẫn Triển Khai Lên Internet (Production Deployment)

### Cách 1: Triển Khai Nhanh Lên Render.com / Railway (Khuyên Dùng Cho Người Mới)
1. Đẩy mã nguồn lên GitHub (repository private).
2. Tạo một **Web Service** mới trên Render.com hoặc Railway.app:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT` = `5000` (hoặc cổng do Render cấp)
     - `ADMIN_KEY` = *[Mật khẩu quản trị của bạn]*
3. Ứng dụng sẽ tự động được cấp tên miền HTTPS miễn phí (ví dụ: `https://secret-letter.onrender.com`).

### Cách 2: Triển Khai Lên VPS Ubuntu Với Nginx & PM2 (Tối Ưu Hiệu Năng & Chi Phí)
1. **Cài đặt Node.js, PM2 & Nginx trên VPS**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx
   sudo npm install -g pm2
   ```
2. **Tải mã nguồn và cài đặt dependencies**:
   ```bash
   cd /var/www/secret-letter
   npm install
   npm run build
   ```
3. **Cấu hình PM2 chạy ngầm liên tục**:
   ```bash
   pm2 start server/index.js --name "secret-letter"
   pm2 save
   pm2 startup
   ```
4. **Cấu hình Nginx làm Reverse Proxy**:
   Tạo file cấu hình `/etc/nginx/sites-available/secret-letter`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   Kích hoạt và cài SSL miễn phí:
   ```bash
   sudo ln -s /etc/nginx/sites-available/secret-letter /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 7. Sao Lưu (Backup) & Khôi Phục Dữ Liệu Khách Hàng

Toàn bộ dữ liệu của khách hàng nằm gọn gàng trong 2 thư mục:
- 📁 `data/`: Chứa `vibeStore.json` và `letters.json`.
- 📁 `uploads/`: Chứa hình ảnh và nhạc tải lên của khách hàng.

**Cách sao lưu**:
Bạn chỉ cần định kỳ sao chép 2 thư mục này hoặc nén lại:
```bash
zip -r backup_$(date +%Y%m%d).zip data/ uploads/
```
Khi chuyển máy chủ, chỉ cần dán 2 thư mục này vào vị trí cũ là 100% dữ liệu thư và hình ảnh của khách hàng được khôi phục nguyên vẹn!

---

🎉 **Chúc bạn kinh doanh thành công và tạo ra thật nhiều niềm vui cảm xúc cho khách hàng cùng Digital Secret Letter!**
