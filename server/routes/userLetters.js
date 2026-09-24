import express from 'express';
import {
  getAllLetters,
  createLetter,
  getLetterById,
  deleteLetter
} from '../db.js';
import { getUserById } from '../userDb.js';
import { hashPassword } from '../auth.js';

const router = express.Router();

/**
 * Middleware xác thực thành viên gửi request
 */
function requireMember(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập tài khoản thành viên.' });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Tài khoản không hợp lệ hoặc đã bị xóa.' });
  }

  if (user.status === 'locked') {
    return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
  }

  req.user = user;
  next();
}

router.use(requireMember);

/**
 * GET /api/user/letters/outbox
 * Lấy danh sách thư đã gửi của thành viên này
 */
router.get('/outbox', (req, res) => {
  const allLetters = getAllLetters();
  const myLetters = allLetters.filter(
    (l) => l.senderId === req.user.id || l.senderUsername === req.user.username
  );

  const sanitized = myLetters.map(({ passwordHash, ...rest }) => rest);
  res.json({ success: true, data: sanitized });
});

/**
 * GET /api/user/letters/inbox
 * Lấy danh sách thư nhận được (gửi đến @username của thành viên này)
 */
router.get('/inbox', (req, res) => {
  const allLetters = getAllLetters();
  const myInbox = allLetters.filter(
    (l) => l.recipientUsername && l.recipientUsername.toLowerCase() === req.user.username.toLowerCase()
  );

  const sanitized = myInbox.map(({ passwordHash, ...rest }) => rest);
  res.json({ success: true, data: sanitized });
});

/**
 * POST /api/user/letters/compose
 * Thành viên soạn và gửi thư mới
 */
router.post('/compose', async (req, res) => {
  try {
    const data = req.body;

    const id = `letter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    let passwordHash = '';
    let hasPassword = false;
    if (data.password && data.password.trim().length > 0) {
      passwordHash = await hashPassword(data.password);
      hasPassword = true;
    }

    // Gán nhạc mặc định theo theme
    const themeAudioMap = {
      tet: '/audio/tet_binh_an.mp3',
      birthday: '/audio/happy_birthday.mp3',
      love: '/audio/tu_khi_gap_em.mp3',
      confide: '/audio/het_duyen_thi_di.mp3'
    };

    const theme = data.theme || 'love';
    const musicUrl = themeAudioMap[theme] || themeAudioMap.love;

    const newLetter = {
      id,
      slug: id,
      // Thông tin Người gửi (Member)
      senderId: req.user.id,
      senderUsername: req.user.username,
      senderName: req.user.displayName,
      senderAvatar: req.user.avatar || '✉️',

      // Thông tin Người nhận
      recipientName: data.recipientName?.trim() || 'Người bạn thân thương',
      recipientUsername: data.recipientUsername ? data.recipientUsername.trim().toLowerCase() : '',

      title: data.title?.trim() || 'Lá Thư Dành Riêng Cho Bạn',
      introQuote: data.introQuote?.trim() || 'Có những điều mình muốn gửi đến bạn...',
      theme,
      passwordHash,
      hasPassword,
      passwordHint: data.passwordHint?.trim() || '',
      music: {
        type: 'custom',
        track: theme,
        customUrl: musicUrl,
        autoplay: true,
        defaultVolume: 0.4
      },
      content: {
        greeting: data.greeting?.trim() || `Gửi ${data.recipientName || 'bạn'},`,
        paragraphs: Array.isArray(data.paragraphs) && data.paragraphs.length > 0
          ? data.paragraphs
          : [data.message?.trim() || 'Nội dung tâm tư gửi đến bạn...'],
        quotes: []
      },
      photos: Array.isArray(data.photos) ? data.photos : [],
      secretUnsaid: {
        enabled: Boolean(data.secretUnsaid?.trim()),
        prompt: '💌 Có một điều mình chưa nói...',
        buttonText: 'Mở phần này',
        content: data.secretUnsaid?.trim() || ''
      },
      finalThought: {
        enabled: Boolean(data.finalThought?.trim()),
        prompt: 'Còn một điều cuối cùng...',
        content: data.finalThought?.trim() || ''
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
    console.error('Lỗi khi thành viên gửi thư:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi gửi thư.' });
  }
});

/**
 * DELETE /api/user/letters/:id
 * Thành viên xóa lá thư mình đã gửi
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const letter = getLetterById(id);

  if (!letter) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lá thư.' });
  }

  // Chỉ cho phép xóa thư do chính mình gửi
  if (letter.senderId !== req.user.id && letter.senderUsername !== req.user.username) {
    return res.status(403).json({ success: false, message: 'Bạn chỉ có quyền xóa thư do chính mình gửi.' });
  }

  const success = deleteLetter(id);
  if (!success) {
    return res.status(500).json({ success: false, message: 'Không thể xóa thư lúc này.' });
  }

  res.json({ success: true, message: 'Đã xóa lá thư thành công.' });
});

export default router;
