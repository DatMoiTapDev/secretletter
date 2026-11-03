import express from 'express';
import { authenticateMember, getUserById } from '../userDb.js';
import { authRateLimiter } from '../security.js';
import { createFirebaseCustomToken } from '../auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Đăng nhập thành viên (có bảo vệ chống brute force)
 * Cung cấp Firebase Custom Token chính thức cho client
 */
router.post('/login', authRateLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ tài khoản và mật khẩu.' });
  }

  try {
    const result = await authenticateMember(username, password);
    if (!result.success) {
      return res.status(401).json({ success: false, message: result.message });
    }

    // Tạo token phiên đăng nhập đơn giản an toàn
    const sessionToken = `usr_token_${result.user.id}_${Date.now()}`;

    // Cấp phát Firebase Custom Token chính thức
    const firebaseCustomToken = createFirebaseCustomToken({
      uid: result.user.id,
      username: result.user.username,
      role: result.user.role || 'member'
    });

    return res.json({
      success: true,
      user: result.user,
      token: sessionToken,
      firebaseCustomToken
    });
  } catch (err) {
    console.error('Lỗi đăng nhập thành viên:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống máy chủ.' });
  }
});

/**
 * POST /api/auth/firebase-custom-token
 * ĐÃ VÔ HIỆU HÓA: Không tin cậy header x-user-id từ client để cấp phát Custom Token.
 * Để nhận Firebase Custom Token hợp lệ, client phải đăng nhập qua POST /api/auth/login có xác thực mật khẩu.
 */
router.post('/firebase-custom-token', (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Endpoint /firebase-custom-token đã bị vô hiệu hóa vì lý do an toàn. Vui lòng xác thực tài khoản qua POST /api/auth/login.'
  });
});

/**
 * GET /api/auth/me
 * ĐÃ VÔ HIỆU HÓA: Không tin cậy header x-user-id từ client để truy vấn thông tin người dùng.
 * Client nhận thông tin người dùng an toàn trực tiếp từ phản hồi của POST /api/auth/login.
 */
router.get('/me', (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Endpoint /api/auth/me đã bị vô hiệu hóa vì lý do an toàn. Thông tin phiên được trả về trực tiếp qua POST /api/auth/login.'
  });
});

export default router;
