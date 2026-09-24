import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const IMAGES_DIR = path.join(UPLOAD_ROOT, 'images');
const AUDIO_DIR = path.join(UPLOAD_ROOT, 'audio');

// Đảm bảo các thư mục upload tồn tại
[UPLOAD_ROOT, IMAGES_DIR, AUDIO_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, AUDIO_DIR);
    } else {
      cb(null, IMAGES_DIR);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueSuffix);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận định dạng ảnh hoặc tệp âm thanh.'));
    }
  }
});

const router = express.Router();

/**
 * Upload tệp ảnh hoặc âm thanh (Admin)
 */
router.post('/', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn tệp để tải lên.' });
  }

  const isAudio = req.file.mimetype.startsWith('audio/');
  const folder = isAudio ? 'audio' : 'images';
  const fileUrl = `/uploads/${folder}/${req.file.filename}`;

  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

export default router;
