import express from 'express';
import {
  getVibeStore,
  findRecipientByIdentifier,
  getRecipientKeys,
  unlockLetterByKeyPassword,
  adminSaveRecipient,
  adminDeleteRecipient,
  adminSaveLetter,
  adminDeleteLetter
} from '../vibeDb.js';
import { requireAdmin } from '../auth.js';

const router = express.Router();

/**
 * 1. GET /api/vibe-hub/themes
 * Lấy danh sách 8 bong bóng chủ đề (CHỈ có ID, Tên, Emoji - KHÔNG có tên người nhận)
 */
router.get('/themes', (req, res) => {
  const store = getVibeStore() || {};
  const themes = Object.values(store).map(t => ({
    id: t.id,
    name: t.name,
    emoji: t.emoji
  }));
  res.json({ success: true, themes });
});

/**
 * 2. POST /api/vibe-hub/identify
 * KHÓA 1: Nhận diện người nhận bằng Tên hoặc Mã riêng
 * Ví dụ: Người dùng gõ "tú" -> Trả về danh sách các chiếc khóa của Tú
 *        Người dùng gõ "khuê" -> Trả về danh sách các chiếc khóa của Khuê
 * BẢO MẬT: Nếu gõ sai -> Báo lỗi, TUYỆT ĐỐI không làm lộ danh sách tên người nhận!
 */
router.post('/identify', async (req, res) => {
  const { themeId, identifier } = req.body;

  if (!identifier || !identifier.trim()) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_PARAM',
      message: 'Vui lòng nhập tên hoặc mật mã nhận diện của bạn.'
    });
  }

  // Delay nhẹ chống brute-force
  await new Promise(r => setTimeout(r, 350));

  // Nhận diện đồng bộ: Quét tìm trên toàn bộ hệ thống
  const recipient = findRecipientByIdentifier(identifier, themeId);

  if (!recipient) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_IDENTIFIER',
      message: 'Hình như chưa đúng rồi... thử lại nhé 💌'
    });
  }

  // Nhận diện thành công -> Trả về tất cả các chiếc khóa thư của người đó
  const keys = (recipient.letters || []).map(l => ({
    id: l.id,
    keyTitle: l.keyTitle,
    keyIcon: l.keyIcon || '🗝️',
    passwordHint: l.passwordHint || ''
  }));

  res.json({
    success: true,
    recipient: {
      id: recipient.id,
      name: recipient.name
    },
    keys
  });
});

/**
 * 3. POST /api/vibe-hub/unlock-letter
 * KHÓA 2: Mở khóa một lá thư cụ thể bằng mật khẩu riêng của lá thư đó
 * Nhận thêm currentThemeId để áp dụng theme nền người dùng đã chọn
 */
router.post('/unlock-letter', async (req, res) => {
  const { letterId, password, currentThemeId } = req.body;

  if (!letterId || password === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Thiếu thông tin mở khóa thư.'
    });
  }

  await new Promise(r => setTimeout(r, 400));

  const result = unlockLetterByKeyPassword(letterId, password, currentThemeId);

  if (!result.success) {
    return res.status(401).json(result);
  }

  res.json(result);
});

/* ========================================================
   CÁC ENDPOINT QUẢN TRỊ CREATOR STUDIO DÀNH RIÊNG CHO TÁC GIẢ
   ======================================================== */

/**
 * GET /api/vibe-hub/admin/all
 * Lấy toàn bộ cây dữ liệu Vibe Hub (Chủ đề -> Người nhận -> Các khóa thư)
 */
router.get('/admin/all', requireAdmin, (req, res) => {
  const store = getVibeStore() || {};
  res.json({ success: true, data: store });
});

/**
 * POST /api/vibe-hub/admin/recipient
 * Thêm hoặc cập nhật người nhận mới
 */
router.post('/admin/recipient', requireAdmin, (req, res) => {
  const { themeId, recipient } = req.body;
  if (!themeId || !recipient || !recipient.name) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin người nhận.' });
  }

  const success = adminSaveRecipient(themeId, recipient);
  res.json({ success });
});

/**
 * DELETE /api/vibe-hub/admin/recipient
 * Xóa người nhận
 */
router.delete('/admin/recipient', requireAdmin, (req, res) => {
  const { themeId, recipientId } = req.body;
  const success = adminDeleteRecipient(themeId, recipientId);
  res.json({ success });
});

/**
 * POST /api/vibe-hub/admin/letter
 * Thêm hoặc cập nhật lá thư dưới người nhận
 */
router.post('/admin/letter', requireAdmin, (req, res) => {
  const { themeId, recipientId, letter } = req.body;
  if (!themeId || !recipientId || !letter || !letter.keyTitle) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin lá thư.' });
  }

  const success = adminSaveLetter(themeId, recipientId, letter);
  res.json({ success });
});

/**
 * DELETE /api/vibe-hub/admin/letter
 * Xóa lá thư
 */
router.delete('/admin/letter', requireAdmin, (req, res) => {
  const { themeId, recipientId, letterId } = req.body;
  const success = adminDeleteLetter(themeId, recipientId, letterId);
  res.json({ success });
});

export default router;

