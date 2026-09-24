import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import lettersRouter from './routes/letters.js';
import uploadRouter from './routes/upload.js';
import vibeHubRouter from './routes/vibeHub.js';
import authRouter from './routes/auth.js';
import adminUsersRouter from './routes/adminUsers.js';
import userLettersRouter from './routes/userLetters.js';
import { initializeEmptyStore } from './vibeDb.js';
import {
  generalApiLimiter,
  authRateLimiter,
  applySecurityHeaders
} from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Khởi tạo khung lưu trữ rỗng an toàn (4 chủ đề cốt lõi trống)
initializeEmptyStore();

// 1. Áp dụng các tiêu đề bảo mật HTTP (Security Headers)
app.use(applySecurityHeaders);

// 2. Middleware cấu hình bảo mật
app.use(cors());
// Thu hẹp giới hạn JSON về 2mb để chống tấn công cạn kiệt bộ nhớ (Memory Exhaustion DoS)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 3. Giới hạn tần suất request chung (Rate Limiting chống DDoS / Scraping)
app.use('/api', generalApiLimiter);

// Static files for uploads
const uploadsPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/letters', lettersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/vibe-hub', vibeHubRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/user/letters', userLettersRouter);

// API Verify Admin Passcode endpoint (kèm Rate Limiting chống dò mật khẩu)
app.post('/api/admin/verify', authRateLimiter, (req, res) => {
  const { password } = req.body;
  const adminSecret = process.env.ADMIN_KEY || 'Tiendat@2006';

  if (password && password === adminSecret) {
    return res.json({ success: true, token: adminSecret });
  }

  // Cố tình delay nhẹ 400ms để triệt tiêu các công cụ tự động brute-force
  setTimeout(() => {
    return res.status(401).json({ success: false, message: 'Mã quản trị không đúng.' });
  }, 400);
});

// Serve frontend in production (dist folder)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// Global error handler (Không để lộ stack trace ra ngoài)
app.use((err, req, res, next) => {
  console.error('Server error:', err?.message || err);
  res.status(500).json({ success: false, message: 'Lỗi hệ thống máy chủ an toàn.' });
});

app.listen(PORT, () => {
  console.log(`✨ Digital Secret Letter Server đang chạy tại: http://localhost:${PORT}`);
});
