# 💌 Digital Secret Letter — Personal Demo & Portfolio Project

<p align="center">
  <img src="https://img.shields.io/badge/Project-Personal%20Demo%20%2F%20Portfolio-amber?style=for-the-badge" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Web%20Crypto-AES--256--GCM-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
</p>

<p align="center">
  🌐 <b>Bản Trình Diễn Trực Tuyến (Portfolio Preview):</b> <a href="https://datmoitapdev.github.io/secretletter/">https://datmoitapdev.github.io/secretletter/</a>
</p>

> [!NOTE]
> **Mục Đích Dự Án**: **Digital Secret Letter** là dự án cá nhân (Personal Demo & Portfolio Showcase) nhằm trình diễn năng lực kỹ thuật Full-stack: kiến trúc giao diện tương tác, hiệu ứng mở phong bì 3D, Web Audio Sound Engine, mã hóa dữ liệu cục bộ với Web Crypto API (AES-256-GCM, PBKDF2), và thuật toán xử lý xung đột đồng thời (Optimistic Concurrency Control - OCC ETag).
> 
> **Tuyên Bố Phạm Vi**: Dự án hiện tại phục vụ mục đích học tập, nghiên cứu và phỏng vấn kỹ thuật; **chưa cung cấp dịch vụ thương mại** và **chưa áp dụng để lưu trữ dữ liệu cá nhân nhạy cảm thực tế**.

---

## ⚠️ Giới Hạn Bảo Mật & Lưu Ý Kỹ Thuật (Security Limitations & Disclaimers)

Nhằm đảm bảo tính minh bạch kỹ thuật tối đa (không quảng cáo sai lệch "an toàn tuyệt đối", "mã hóa cục bộ" hay "E2EE hoàn hảo"):

1. **Lưu trữ Cục bộ trên GitHub Pages (Plain JSON LocalStorage)**:
   - Trong bản demo web tĩnh (GitHub Pages), dữ liệu tài khoản (`gh_mock_users`), thư (`gh_mock_letters`) và Vibe Hub được lưu trữ dưới dạng **JSON thông thường (plaintext)** trong `LocalStorage` của trình duyệt người dùng.
   - Bất kỳ ai mở Developer Tools (F12) đều có thể xem và chỉnh sửa dữ liệu này. **Tuyệt đối KHÔNG lưu trữ mật khẩu thật, thư nhạy cảm hoặc bí mật cá nhân** trong phiên bản demo này.
2. **Khóa Mặc Định `VAULT_SECRET` (Hardcoded Secret Limitation)**:
   - Trong mã nguồn frontend, chuỗi `VAULT_SECRET` là passphrase cố định công khai trong client bundle, dùng để trình diễn thuật toán mã hóa AES-256-GCM + PBKDF2 (100,000 rounds).
   - Việc dùng khóa công khai hardcode **không đem lại tính bảo mật thực tế**. Khi ứng dụng hoạt động không có mật khẩu người dùng tự chọn, dữ liệu mã hóa này có thể bị giải mã bởi bất kỳ ai có client bundle.
3. **Tính Năng Đồng Bộ Đám Mây (Cloud Sync Đã Tắt Hoàn Toàn)**:
   - Để ngăn ngừa các cuộc gọi mạng unauthenticated ra ngoài, chống rò rỉ dữ liệu và bảo vệ tính nguyên vẹn của hệ thống, tính năng Cloud Sync tự động **đã bị tắt hoàn toàn** trong bản demo này (kể cả khi LocalStorage có URL cũ hoặc URL truyền qua query string).
   - Dữ liệu người dùng trên máy hiện tại không bị xóa. Để chuyển dữ liệu giữa các máy, người dùng có thể dùng **Quét Mã QR** hoặc **Xuất/Nạp File .json dự phòng**.
4. **Không Có Cơ Chế Khôi Phục Mật Mã**:
   - Khi người dùng đặt mật mã riêng cho từng lá thư, nội dung được mã hóa theo mật mã đó. Nếu quên mật mã, nội dung lá thư sẽ vĩnh viễn không thể khôi phục do không có backdoor hay master key giải mã.

---

## 🌟 Tính Năng Trình Diễn Kỹ Thuật (Showcase Features)

### 1. 🏛️ Kiến Trúc 3 Tầng Giao Diện Riêng Biệt

```
┌────────────────────────────────────────────────────────┐
│ 1. Trang Chủ Công Khai (/)                            │
│    - Dành cho khách vãng lai & người nhận thư         │
│    - Xem 4 bong bóng: Tết, Sinh nhật, Yêu, Tâm tình   │
│    - Mở Khóa 1 & Khóa 2, đọc thư và nghe nhạc         │
│    - Không bắt buộc đăng nhập                         │
└────────────────────────────────────────────────────────┘
                           │
       [ Nút "💌 Gửi Thư" trên Header ]
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. Hòm Thư Thành Viên (/login & /dashboard)           │
│    - Đăng nhập bằng tài khoản do Admin cấp             │
│    - Không gian cô lập 100%, không ai can thiệp thư ai│
│    - Hòm thư Đã Gửi (Outbox) & Nhận Được (Inbox)      │
│    - Soạn thư kỹ thuật số mới (/dashboard/compose)    │
│    - Tự động gắn bài hát MP3 tương ứng                 │
└────────────────────────────────────────────────────────┘
                           ▲
          [ Admin cấp tài khoản & mật khẩu ]
                           │
┌────────────────────────────────────────────────────────┐
│ 3. Bảng Quản Trị Hệ Thống Master Admin (/admin)        │
│    - Khóa an toàn mã quản trị (Passcode Protection)    │
│    - Quản lý 4 chủ đề Vibe Hub & Khóa 2 tầng           │
│    - Quản lý thư đường dẫn riêng (/letter/:id)         │
│    - Quản trị tài khoản thành viên (Tạo/Khóa/Xóa)      │
└────────────────────────────────────────────────────────┘
```

---

### 2. 🎈 4 Chủ Đề Cốt Lõi & Nhạc Nền Tự Động
Khi người dùng chạm vào một chủ đề, giai điệu tương ứng sẽ tự động vang lên du dương:

| Chủ Đề | Biểu Tượng | Bài Hát Tự Động | Cảm Xúc |
| :--- | :---: | :--- | :--- |
| **Tết** | 🧧 | *Tết Bình An* | Rộn ràng, ấm cúng sum vầy đoàn viên |
| **Sinh nhật** | 🎂 | *Happy Birthday To You* | Tươi vui, rạng rỡ chào tuổi mới |
| **Yêu** | 💖 | *Từ Khi Gặp Em* | Ngọt ngào, lãng mạn và chân thành |
| **Tâm tình** | 🍃 | *Hết Duyên Thì Đi* | Sâu lắng, đồng điệu và sẻ chia tâm tư |

---

### 3. ✨ Trải Nghiệm Người Nhận Tinh Tế
* **Cơ Chế Khóa 2 Tầng Độc Quyền:**
  * **Khóa 1 (Tên / Biệt danh):** Nhận diện người nhận qua biệt danh thân mật (ví dụ: *Hà Phương*, *Bé Thỏ*...).
  * **Khóa 2 (Ổ khóa thư riêng):** Mỗi người có thể có nhiều ổ khóa thư nhỏ với mật mã và gợi ý riêng biệt.
* **Phong Bì Mở Nắp 3D:** Hiệu ứng xé niêm phong và mở nắp phong bì chuyển động mượt mà.
* **💌 Điều Chưa Nói (Secret Unsaid):** Phần bí mật ẩn trong thư, người nhận chạm nhẹ để bóc mở bất ngờ.
* **📱💻 Giao Diện Responsive Toàn Diện:** Tự động thích ứng hoàn hảo khi truy cập bằng Điện thoại di động (Mobile) hoặc Máy tính (Desktop/Laptop).
* **☀️ / 🌙 Touch Button Sáng/Tối:** Chuyển đổi nền sáng kem nhã nhặn hoặc nền tối huyền bí chỉ với một chạm.

---

### 4. 🛡️ Cơ Chế Bảo Mật & Chống DDoS Cao Cấp
* **Rate Limiting (Chống Brute-force & DDoS):**
  * Giới hạn **tối đa 6 lần đăng nhập trong 5 phút** trên mỗi địa chỉ IP tại cổng Admin & Thành viên.
  * Giới hạn **10 lần đoán mật mã thư trong 3 phút** tại `/unlock`.
  * Giới hạn chung **120 requests/phút** cho toàn bộ API hệ thống.
* **Chống Timing Attack:** Thuật toán so khớp băm giả lập độ trễ bằng nhau, ngăn kẻ xấu dò tìm username tồn tại.
* **Chống Cạn Kiệt Bộ Nhớ (Payload DoS):** Giới hạn kích thước gói tin gửi lên tối đa **2MB**.
* **Ẩn Danh Máy Chủ (Security Headers):** Tự động gỡ bỏ `X-Powered-By`, bật `nosniff`, `SAMEORIGIN`.
* **Bảo Vệ Kho Lưu Trữ:** File cấu hình mật khẩu `.env` và tài liệu quản trị nội bộ được bảo vệ bởi `.gitignore`, không bao giờ bị rò rỉ lên GitHub.

---

## 🛠️ Công Nghệ Sử Dụng

* **Frontend:**
  * [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) (Build cực nhanh, Hot Module Replacement)
  * [Tailwind CSS](https://tailwindcss.com/) (Hệ thống thiết kế responsive mượt mà)
  * [Lucide React](https://lucide.dev/) (Bộ icon hiện đại, tối giản)
  * HTML5 Canvas Particle Engine (Hiệu ứng cánh hoa, tuyết rơi, bụi sao)
  * Web Audio Engine (Quản lý âm lượng, chuyển bài, phát nhạc mượt mà)
* **Backend:**
  * [Node.js](https://nodejs.org/) & [Express 4](https://expressjs.com/)
  * [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js) (Mã hóa mật khẩu chuẩn công nghiệp)
  * [QRCode](https://github.com/soldair/node-qrcode) (Tự động tạo mã QR quét thư)
  * In-memory Sliding Window Rate Limiter (Tự động dọn dẹp bộ nhớ RAM định kỳ)
* **Lưu Trữ Dữ Liệu:**
  * JSON-based Storage System (`data/letters.json`, `data/vibeStore.json`, `data/users.json`): Không cần cài đặt cơ sở dữ liệu cồng kềnh, dễ dàng sao lưu và triển khai ở bất kỳ đâu.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### 1. Yêu Cầu Môi Trường
* [Node.js](https://nodejs.org/) phiên bản 18 trở lên.

### 2. Cài Đặt Mã Nguồn
```bash
# 1. Clone repository về máy
git clone https://github.com/DatMoiTapDev/secretletter.git

# 2. Di chuyển vào thư mục dự án
cd secretletter

# 3. Cài đặt các gói thư viện phụ thuộc
npm install
```

### 3. Cấu Hình Môi Trường
Tạo file `.env` tại thư mục gốc (hoặc sao chép từ `.env.example`):
```env
PORT=5000
ADMIN_KEY=MatKhauQuanTriCuaBan@2026
APP_NAME=Digital Secret Letter
```

### 4. Khởi Chạy Ứng Dụng
```bash
# Chạy đồng thời cả Server Backend (port 5000) và Client Frontend (port 3000)
npm run dev
```
Mở trình duyệt truy cập:
* **Trang chủ công khai:** [http://localhost:3000](http://localhost:3000)
* **Hòm thư thành viên:** [http://localhost:3000/login](http://localhost:3000/login)
* **Quản trị hệ thống:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🌐 Hướng Dẫn Triển Khai Lên Web (Production)

Dự án đã được đóng gói sẵn sàng để triển khai chỉ với 1 cú click lên các dịch vụ đám mây miễn phí:

### Triển khai trên Render.com:
1. Đăng nhập [Render.com](https://render.com) bằng tài khoản GitHub.
2. Bấm **New +** > Chọn **Web Service** > Chọn repository `secretletter`.
3. Cấu hình:
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `node server/index.js`
4. Trong mục **Environment Variables**, thêm:
   * `ADMIN_KEY`: `Mật_khẩu_quản_trị_của_bạn`
   * `NODE_ENV`: `production`
5. Bấm **Create Web Service**. Ứng dụng sẽ tự động online sau 2 phút!

---

## 📜 Giấy Phép & Bản Quyền
Dự án được phân phối dưới giấy phép **MIT License**. Bạn hoàn toàn có quyền sử dụng, tùy biến và thương mại hóa nền tảng này.

---

<p align="center">
  Phát triển với tất cả tâm huyết và tình cảm 💖 • <i>Digital Secret Letter Team</i>
</p>
