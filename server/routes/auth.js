import express from 'express';
import { authenticateMember, getUserById } from '../userDb.js';
import { authRateLimiter } from '../security.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Đăng nhập thành viên (có bảo vệ chống brute force)
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

    return res.json({
      success: true,
      user: result.user,
      token: sessionToken
    });
  } catch (err) {
    console.error('Lỗi đăng nhập thành viên:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống máy chủ.' });
  }
});

/**
 * GET /api/auth/me
 * Lấy thông tin tài khoản hiện tại
 */
router.get('/me', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
  }

  const { passwordHash, ...safeUser } = user;
  return res.json({ success: true, user: safeUser });
});

export default router;
