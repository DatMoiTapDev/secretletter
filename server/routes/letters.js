import express from 'express';
import {
  getAllLetters,
  getLetterById,
  createLetter,
  updateLetter,
  deleteLetter,
  recordOpen
} from '../db.js';
import { hashPassword, verifyPassword, requireAdmin } from '../auth.js';
import { letterUnlockLimiter } from '../security.js';

const router = express.Router();

/**
 * 1. GET /api/letters
 * Lấy danh sách tất cả lá thư (dành cho Admin Creator Studio)
 */
router.get('/', requireAdmin, (req, res) => {
  const letters = getAllLetters();
  // Loại bỏ passwordHash khi trả về danh sách admin
  const sanitized = letters.map(l => {
    const { passwordHash, ...rest } = l;
    return rest;
  });
  res.json({ success: true, data: sanitized });
});

/**
 * 2. GET /api/letters/:id/meta
 * Endpoint CÔNG KHAI dành cho Người Nhận khi vừa vào link
 * BẢO MẬT: Tuyệt đối KHÔNG trả về nội dung thư, ảnh, bí mật, mật khẩu hash
 */
router.get('/:id/meta', (req, res) => {
  const { id } = req.params;
  const letter = getLetterById(id);

  if (!letter) {
    return res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: 'Có vẻ chiếc phong bì này đã đi lạc mất rồi...'
    });
  }

  // Kiểm tra thời hạn
  const isExpired = letter.expiresAt && new Date(letter.expiresAt) < new Date();

  // Chỉ trả về metadata công khai
  const publicMeta = {
    id: letter.id,
    slug: letter.slug,
    recipientName: letter.recipientName,
    title: letter.title,
    introQuote: letter.introQuote,
    theme: letter.theme,
    hasPassword: Boolean(letter.hasPassword && letter.passwordHash),
    passwordHint: letter.passwordHint || '',
    isExpired: Boolean(isExpired),
    expiresAt: letter.expiresAt,
    createdAt: letter.createdAt,
    // Trả về cấu hình nhạc cơ bản nếu cần hiển thị icon
    musicPreset: letter.music?.track || 'preset'
  };

  res.json({ success: true, meta: publicMeta });
});

/**
 * 3. POST /api/letters/:id/unlock
 * Mở khóa thư sau khi người nhận nhập mật khẩu
 * BẢO MẬT: Chỉ trả về nội dung khi mật khẩu trùng khớp
 */
router.post('/:id/unlock', letterUnlockLimiter, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  const letter = getLetterById(id);

  if (!letter) {
    return res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: 'Lá thư không tồn tại hoặc đã bị gỡ bỏ.'
    });
  }

  // Kiểm tra hết hạn
  if (letter.expiresAt && new Date(letter.expiresAt) < new Date()) {
    return res.status(410).json({
      success: false,
      code: 'EXPIRED',
      message: 'Lá thư này đã hết thời hạn mở. Kỷ niệm đẹp đôi khi chỉ dành cho một khoảnh khắc.'
    });
  }

  // Xác thực mật khẩu
  if (letter.hasPassword && letter.passwordHash) {
    const isMatch = await verifyPassword(password, letter.passwordHash);
    if (!isMatch) {
      // Delay nhẹ để tránh brute-force attack
      await new Promise(r => setTimeout(r, 400));
      return res.status(401).json({
        success: false,
        code: 'INVALID_PASSWORD',
        message: 'Hình như chưa đúng rồi... thử lại nhé 💌'
      });
    }
  }

  // Ghi nhận lượt mở thư
  recordOpen(letter.id);

  // Mở khóa thành công, trả về toàn bộ nội dung thư (loại bỏ passwordHash)
  const { passwordHash, ...unlockedLetter } = letter;

  res.json({
    success: true,
    data: unlockedLetter
  });
});

/**
 * 4. GET /api/letters/:id
 * Lấy chi tiết lá thư (chỉ dành cho Admin để chỉnh sửa)
 */
router.get('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const letter = getLetterById(id);
  if (!letter) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy thư.' });
  }
  const { passwordHash, ...rest } = letter;
  res.json({ success: true, data: { ...rest, hasExistingPassword: Boolean(passwordHash) } });
});

/**
 * 5. POST /api/letters
 * Tạo mới lá thư (Admin)
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const data = req.body;

    // Tạo ID/slug ngẫu nhiên nếu không nhập
    const id = (data.slug || data.id || `letter-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-');

    // Kiểm tra trùng ID
    if (getLetterById(id)) {
      return res.status(400).json({ success: false, message: 'Mã đường dẫn (ID/Slug) này đã tồn tại, vui lòng chọn mã khác.' });
    }

    let passwordHash = '';
    let hasPassword = false;
    if (data.password && data.password.trim().length > 0) {
      passwordHash = await hashPassword(data.password);
      hasPassword = true;
    }

    const newLetter = {
      id,
      slug: id,
      recipientName: data.recipientName || 'Bạn thân mến',
      title: data.title || 'Lá Thư Dành Riêng Cho Bạn',
      introQuote: data.introQuote || 'Có một vài điều mình muốn bạn đọc thật chậm...',
      theme: data.theme || 'christmas',
      passwordHash,
      hasPassword,
      passwordHint: data.passwordHint || '',
      music: data.music || {
        type: 'preset',
        track: 'dreamy_piano',
        customUrl: '',
        autoplay: true,
        defaultVolume: 0.3
      },
      content: data.content || {
        greeting: 'Gửi bạn,',
        paragraphs: ['Nội dung lá thư...'],
        quotes: []
      },
      photos: Array.isArray(data.photos) ? data.photos : [],
      secretUnsaid: data.secretUnsaid || {
        enabled: false,
        prompt: '💌 Có một điều mình chưa nói...',
        buttonText: 'Mở phần này',
        content: ''
      },
      finalThought: data.finalThought || {
        enabled: false,
        prompt: 'Còn một điều cuối cùng...',
        content: ''
      },
      createdAt: new Date().toISOString(),
      expiresAt: data.expiresAt || null,
      openedCount: 0,
      lastOpenedAt: null
    };

    createLetter(newLetter);

    const { passwordHash: _, ...created } = newLetter;
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('Lỗi khi tạo lá thư:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo thư.' });
  }
});

/**
 * 6. PUT /api/letters/:id
 * Cập nhật lá thư (Admin)
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = getLetterById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thư để sửa.' });
    }

    const data = req.body;
    const updatePayload = { ...data };

    // Xử lý cập nhật mật khẩu nếu có nhập mật khẩu mới
    if (data.newPassword && data.newPassword.trim().length > 0) {
      updatePayload.passwordHash = await hashPassword(data.newPassword);
      updatePayload.hasPassword = true;
    } else if (data.clearPassword) {
      updatePayload.passwordHash = '';
      updatePayload.hasPassword = false;
    }
    delete updatePayload.newPassword;
    delete updatePayload.clearPassword;

    const updated = updateLetter(id, updatePayload);
    const { passwordHash: _, ...rest } = updated;
    res.json({ success: true, data: rest });
  } catch (err) {
    console.error('Lỗi khi sửa lá thư:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật thư.' });
  }
});

/**
 * 7. DELETE /api/letters/:id
 * Xóa lá thư (Admin)
 */
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const success = deleteLetter(id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy thư để xóa.' });
  }
  res.json({ success: true, message: 'Đã xóa lá thư thành công.' });
});

export default router;
