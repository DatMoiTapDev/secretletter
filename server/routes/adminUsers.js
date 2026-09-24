import express from 'express';
import { requireAdmin } from '../auth.js';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../userDb.js';
import { getAllLetters } from '../db.js';

const router = express.Router();

// Tất cả các route ở đây đều yêu cầu quyền Master Admin
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * Lấy danh sách thành viên kèm thống kê thư
 */
router.get('/', (req, res) => {
  try {
    const users = getAllUsers();
    const letters = getAllLetters();

    // TUYỆT ĐỐI BẢO MẬT: Loại trừ tài khoản quản trị tối cao khỏi danh sách thành viên
    const members = users.filter(
      (u) => u.role !== 'admin' && u.username !== 'admin' && u.username !== 'tiendat'
    );

    const result = members.map((u) => {
      const { passwordHash, ...safe } = u;
      const sentCount = letters.filter(
        (l) => l.senderId === u.id || l.senderUsername === u.username
      ).length;
      const receivedCount = letters.filter(
        (l) => l.recipientUsername && l.recipientUsername.toLowerCase() === u.username.toLowerCase()
      ).length;

      return {
        ...safe,
        sentCount,
        receivedCount
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Lỗi lấy danh sách thành viên:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

/**
 * POST /api/admin/users
 * Admin cấp tài khoản mới cho thành viên
 */
router.post('/', async (req, res) => {
  const { username, password, displayName, avatar } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền tên tài khoản và mật khẩu ban đầu.'
    });
  }

  const clean = username.toLowerCase().trim();
  if (clean === 'admin' || clean === 'tiendat') {
    return res.status(400).json({
      success: false,
      message: 'Tên tài khoản này được bảo lưu cho quản trị viên tối cao.'
    });
  }

  if (username.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Tên tài khoản tối thiểu 3 ký tự.'
    });
  }

  try {
    const newUser = await createUser({
      username,
      password,
      displayName,
      avatar
    });

    const { passwordHash, ...safe } = newUser;
    res.status(201).json({ success: true, data: safe });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/admin/users/:id
 * Cập nhật tài khoản (khóa/mở khóa, đổi mật khẩu, đổi tên)
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const target = getUserById(id);
    if (target && (target.role === 'admin' || target.username === 'admin' || target.username === 'tiendat')) {
      return res.status(403).json({ success: false, message: 'Không thể chỉnh sửa tài khoản quản trị tối cao.' });
    }

    const updated = await updateUser(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    }

    const { passwordHash, ...safe } = updated;
    res.json({ success: true, data: safe });
  } catch (err) {
    console.error('Lỗi cập nhật người dùng:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi cập nhật.' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Xóa tài khoản thành viên
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const target = getUserById(id);
  if (target && (target.role === 'admin' || target.username === 'admin' || target.username === 'tiendat')) {
    return res.status(403).json({ success: false, message: 'Không thể xóa tài khoản quản trị tối cao.' });
  }

  const success = deleteUser(id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản để xóa.' });
  }

  res.json({ success: true, message: 'Đã xóa tài khoản thành công.' });
});

export default router;
