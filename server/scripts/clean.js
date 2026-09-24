import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const VIBE_FILE = path.join(DATA_DIR, 'vibeStore.json');
const LETTERS_FILE = path.join(DATA_DIR, 'letters.json');

console.log('🧹 Đang tiến hành làm sạch toàn bộ dữ liệu dự án về Bản Khung Trắng...');

// 1. Đặt lại vibeStore.json
const emptyVibeStore = {
  tet: { id: 'tet', name: 'Tết', emoji: '🧧', recipients: [] },
  birthday: { id: 'birthday', name: 'Sinh nhật', emoji: '🎂', recipients: [] },
  cute: { id: 'cute', name: 'Yêu', emoji: '💕', recipients: [] },
  emotional: { id: 'emotional', name: 'Tâm tình', emoji: '🌙', recipients: [] }
};

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

fs.writeFileSync(VIBE_FILE, JSON.stringify(emptyVibeStore, null, 2), 'utf-8');
console.log('✅ Đã làm sạch vibeStore.json (4 chủ đề cốt lõi trống, 0 người nhận).');

// 2. Đặt lại letters.json
fs.writeFileSync(LETTERS_FILE, '[]', 'utf-8');
console.log('✅ Đã làm sạch letters.json (0 lá thư link trực tiếp).');

// 3. Dọn dẹp thư mục uploads (nếu có file thừa)
const imagesDir = path.join(UPLOADS_DIR, 'images');
const audioDir = path.join(UPLOADS_DIR, 'audio');

[imagesDir, audioDir].forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
      try {
        fs.unlinkSync(path.join(dir, f));
      } catch (e) {}
    });
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
});
console.log('✅ Đã làm sạch thư mục uploads (images & audio).');

console.log('🎉 BẢN KHUNG TRẮNG HOÀN CHỈNH ĐÃ SẴN SÀNG ĐỂ THƯƠNG MẠI HÓA!');
