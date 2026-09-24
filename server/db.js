import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'letters.json');

// Đảm bảo thư mục data tồn tại
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Đọc tất cả lá thư từ tệp
 */
export function getAllLetters() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Lỗi khi đọc file letters.json:', err);
    return [];
  }
}

/**
 * Ghi danh sách lá thư vào tệp một cách an toàn
 */
export function saveAllLetters(letters) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(letters, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Lỗi khi lưu file letters.json:', err);
    return false;
  }
}

/**
 * Lấy lá thư theo ID (hoặc slug)
 */
export function getLetterById(id) {
  const letters = getAllLetters();
  return letters.find(l => l.id === id || l.slug === id);
}

/**
 * Tạo mới lá thư
 */
export function createLetter(letterData) {
  const letters = getAllLetters();
  letters.unshift(letterData);
  saveAllLetters(letters);
  return letterData;
}

/**
 * Cập nhật lá thư
 */
export function updateLetter(id, updateFields) {
  const letters = getAllLetters();
  const index = letters.findIndex(l => l.id === id || l.slug === id);
  if (index === -1) return null;

  letters[index] = {
    ...letters[index],
    ...updateFields,
    updatedAt: new Date().toISOString()
  };
  saveAllLetters(letters);
  return letters[index];
}

/**
 * Xóa lá thư
 */
export function deleteLetter(id) {
  const letters = getAllLetters();
  const filtered = letters.filter(l => l.id !== id && l.slug !== id);
  if (filtered.length === letters.length) return false;
  saveAllLetters(filtered);
  return true;
}

/**
 * Tăng số lượt mở thư
 */
export function recordOpen(id) {
  const letters = getAllLetters();
  const letter = letters.find(l => l.id === id || l.slug === id);
  if (letter) {
    letter.openedCount = (letter.openedCount || 0) + 1;
    letter.lastOpenedAt = new Date().toISOString();
    saveAllLetters(letters);
  }
}
