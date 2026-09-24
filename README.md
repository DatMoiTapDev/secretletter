# 💌 Digital Secret Letter - Nền Tảng Lá Thư Bí Mật Kỹ Thuật Số

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Security-Protected-FFD700?style=for-the-badge&logo=auth0&logoColor=black" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
</p>

<p align="center">
  🌐 <b>Website Trực Tuyến (Live Demo):</b> <a href="https://datmoitapdev.github.io/secretletter/">https://datmoitapdev.github.io/secretletter/</a>
</p>

> **Digital Secret Letter** là nền tảng web tạo và gửi những lá thư kỹ thuật số cảm xúc, tinh tế và an toàn tuyệt đối. Được thiết kế với kiến trúc **3 tầng giao diện độc lập**, hiệu ứng mở phong bì 3D sống động, nhạc nền MP3 tự động theo 4 chủ đề và cơ chế bảo mật hai tầng ổ khóa độc đáo.

---

## 🌟 Demo & Tính Năng Cốt Lõi

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
* **✨ Spotlight Điều Cuối Cùng:** Thông điệp kết thúc nổi bật khi người đọc hoàn tất lá thư.
* **📱💻 Chế Độ 2 Màn Hình (Dual View):** Xem đồng thời cả giao diện trên Điện thoại di động và Máy tính xách tay tại `/dual`.
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
