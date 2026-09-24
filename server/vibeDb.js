import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const VIBE_DB_FILE = path.join(DATA_DIR, 'vibeStore.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Chuẩn hóa chuỗi tìm kiếm (xóa dấu tiếng Việt, chữ thường, bỏ khoảng trắng thừa)
 * để người dùng gõ "tú", "tu", "Tú", "TU" đều nhận diện chính xác
 */
export function normalizeKey(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

/**
 * Khởi tạo khung 8 chủ đề trống (White-label Boilerplate) nếu chưa có dữ liệu
 */
export function initializeEmptyStore() {
  const defaultEmptyStore = {
    tet: { id: 'tet', name: 'Tết', emoji: '🧧', recipients: [] },
    birthday: { id: 'birthday', name: 'Sinh nhật', emoji: '🎂', recipients: [] },
    cute: { id: 'cute', name: 'Yêu', emoji: '💕', recipients: [] },
    emotional: { id: 'emotional', name: 'Tâm tình', emoji: '🌙', recipients: [] }
  };

  try {
    if (!fs.existsSync(VIBE_DB_FILE)) {
      saveVibeStore(defaultEmptyStore);
      return defaultEmptyStore;
    }
    const data = fs.readFileSync(VIBE_DB_FILE, 'utf-8');
    const parsed = JSON.parse(data || '{}');
    if (Object.keys(parsed).length === 0) {
      saveVibeStore(defaultEmptyStore);
      return defaultEmptyStore;
    }
    return parsed;
  } catch (err) {
    console.error('Lỗi kiểm tra/khởi tạo vibeStore:', err);
    saveVibeStore(defaultEmptyStore);
    return defaultEmptyStore;
  }
}

/**
 * Xóa sạch toàn bộ dữ liệu người nhận và đưa về khung trắng
 */
export function clearAllData() {
  const emptyStore = {
    tet: { id: 'tet', name: 'Tết Bình An', emoji: '🧧', recipients: [] },
    birthday: { id: 'birthday', name: 'Sinh Nhật Rực Rỡ', emoji: '🎂', recipients: [] },
    cute: { id: 'cute', name: 'Ngọt Ngào Dễ Thương', emoji: '💕', recipients: [] },
    emotional: { id: 'emotional', name: 'Tâm Tình Sâu Lắng', emoji: '🌙', recipients: [] }
  };
  saveVibeStore(emptyStore);
  return emptyStore;
}

/**
 * Đọc toàn bộ dữ liệu Vibe Store
 */
export function getVibeStore() {
  try {
    if (!fs.existsSync(VIBE_DB_FILE)) {
      return initializeEmptyStore();
    }
    const data = fs.readFileSync(VIBE_DB_FILE, 'utf-8');
    const parsed = JSON.parse(data || '{}');
    if (Object.keys(parsed).length === 0) {
      return initializeEmptyStore();
    }
    return parsed;
  } catch (err) {
    console.error('Lỗi khi đọc file vibeStore.json:', err);
    return initializeEmptyStore();
  }
}

/**
 * Lưu dữ liệu Vibe Store an toàn
 */
export function saveVibeStore(store) {
  try {
    const tempFile = `${VIBE_DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tempFile, VIBE_DB_FILE);
    return true;
  } catch (err) {
    console.error('Lỗi khi lưu file vibeStore.json:', err);
    return false;
  }
}

/**
 * Tìm người nhận dựa vào chuỗi định danh (Khóa 1)
 * ĐỒNG BỘ TOÀN DIỆN: Quét tìm trên toàn bộ hệ thống và gom tất cả các chiếc khóa
 * của người đó, giúp người dùng tự do chọn bất kỳ nền/vibe nào mà vẫn mở được đầy đủ thư!
 */
export function findRecipientByIdentifier(identifier, themeId = null) {
  const store = getVibeStore();
  if (!store) return null;

  const searchNorm = normalizeKey(identifier);
  const searchExact = identifier.toLowerCase().trim();

  let matchedRecipientInfo = null;
  const mergedLetters = [];
  const seenLetterIds = new Set();
  const allAliases = new Set();

  for (const [tId, themeData] of Object.entries(store)) {
    if (!themeData.recipients || !Array.isArray(themeData.recipients)) continue;

    for (const r of themeData.recipients) {
      const matchId = r.id.toLowerCase() === searchExact || normalizeKey(r.id) === searchNorm;
      const matchName = r.name.toLowerCase() === searchExact || normalizeKey(r.name) === searchNorm;
      const matchAlias = Array.isArray(r.aliases) && r.aliases.some(alias => 
        alias.toLowerCase() === searchExact || normalizeKey(alias) === searchNorm
      );

      if (matchId || matchName || matchAlias) {
        if (!matchedRecipientInfo) {
          matchedRecipientInfo = {
            id: r.id,
            name: r.name
          };
        }
        if (Array.isArray(r.aliases)) {
          r.aliases.forEach(a => allAliases.add(a));
        }
        if (Array.isArray(r.letters)) {
          r.letters.forEach(l => {
            if (!seenLetterIds.has(l.id)) {
              seenLetterIds.add(l.id);
              mergedLetters.push(l);
            }
          });
        }
      }
    }
  }

  if (!matchedRecipientInfo) return null;

  return {
    id: matchedRecipientInfo.id,
    name: matchedRecipientInfo.name,
    aliases: Array.from(allAliases),
    letters: mergedLetters
  };
}

/**
 * Lấy danh sách các chiếc khóa của người nhận (KHÔNG trả về nội dung thư hay mật khẩu)
 */
export function getRecipientKeys(recipientId, themeId = null) {
  const store = getVibeStore();
  if (!store) return [];

  const keys = [];
  const seenLetterIds = new Set();

  for (const [tId, themeData] of Object.entries(store)) {
    if (!themeData.recipients) continue;
    const recipient = themeData.recipients.find(r => r.id === recipientId);
    if (recipient && Array.isArray(recipient.letters)) {
      recipient.letters.forEach(letter => {
        if (!seenLetterIds.has(letter.id)) {
          seenLetterIds.add(letter.id);
          keys.push({
            id: letter.id,
            keyTitle: letter.keyTitle,
            keyIcon: letter.keyIcon || '🗝️',
            passwordHint: letter.passwordHint || ''
          });
        }
      });
    }
  }

  return keys;
}

/**
 * Mở khóa một lá thư cụ thể bằng mật khẩu riêng của lá thư đó (Khóa 2)
 * Cho phép áp dụng theme nền do chính người dùng lựa chọn (userSelectedTheme)
 */
export function unlockLetterByKeyPassword(letterId, enteredPassword, userSelectedTheme = null) {
  const store = getVibeStore();
  if (!store) return { success: false, message: 'Dữ liệu không khả dụng.' };

  let targetLetter = null;
  let targetRecipient = null;
  let targetThemeId = null;

  // Quét tìm lá thư qua các chủ đề và người nhận
  for (const [themeId, themeData] of Object.entries(store)) {
    if (!themeData.recipients) continue;
    for (const recipient of themeData.recipients) {
      if (!recipient.letters) continue;
      const found = recipient.letters.find(l => l.id === letterId);
      if (found) {
        targetLetter = found;
        targetRecipient = recipient;
        targetThemeId = themeId;
        break;
      }
    }
    if (targetLetter) break;
  }

  if (!targetLetter) {
    return { success: false, code: 'NOT_FOUND', message: 'Lá thư không tồn tại.' };
  }

  // So khớp mật khẩu của chiếc khóa này
  const passNorm = normalizeKey(enteredPassword);
  const correctPassNorm = normalizeKey(targetLetter.letterPassword);

  if (passNorm !== correctPassNorm) {
    return {
      success: false,
      code: 'INVALID_PASSWORD',
      message: 'Mật khẩu chiếc khóa này chưa đúng... thử lại nhé 💌'
    };
  }

  // Trả về nội dung lá thư hoàn chỉnh với theme người dùng đã chọn
  return {
    success: true,
    letter: {
      id: targetLetter.id,
      recipientName: targetRecipient.name,
      title: targetLetter.title,
      introQuote: targetLetter.introQuote,
      theme: userSelectedTheme || targetThemeId || 'christmas',
      content: targetLetter.content,
      photos: targetLetter.photos || [],
      secretUnsaid: targetLetter.secretUnsaid,
      finalThought: targetLetter.finalThought,
      music: targetLetter.music || { type: 'preset', track: 'dreamy_piano' }
    }
  };
}

/**
 * QUẢN TRỊ (ADMIN): Thêm hoặc sửa Người nhận trong chủ đề
 */
export function adminSaveRecipient(themeId, recipientData) {
  const store = getVibeStore() || {};
  if (!store[themeId]) {
    store[themeId] = { id: themeId, name: themeId, emoji: '💌', recipients: [] };
  }
  if (!Array.isArray(store[themeId].recipients)) {
    store[themeId].recipients = [];
  }

  const existingIdx = store[themeId].recipients.findIndex(r => r.id === recipientData.id);
  if (existingIdx !== -1) {
    store[themeId].recipients[existingIdx] = {
      ...store[themeId].recipients[existingIdx],
      name: recipientData.name,
      aliases: recipientData.aliases || [recipientData.name.toLowerCase()]
    };
  } else {
    store[themeId].recipients.push({
      id: recipientData.id || `rec-${Date.now()}`,
      name: recipientData.name,
      aliases: recipientData.aliases || [recipientData.name.toLowerCase()],
      letters: []
    });
  }

  saveVibeStore(store);
  return true;
}

/**
 * QUẢN TRỊ (ADMIN): Xóa Người nhận
 */
export function adminDeleteRecipient(themeId, recipientId) {
  const store = getVibeStore() || {};
  if (!store[themeId] || !store[themeId].recipients) return false;
  store[themeId].recipients = store[themeId].recipients.filter(r => r.id !== recipientId);
  saveVibeStore(store);
  return true;
}

/**
 * QUẢN TRỊ (ADMIN): Thêm hoặc sửa Lá thư (Khóa 2) dưới Người nhận
 */
export function adminSaveLetter(themeId, recipientId, letterData) {
  const store = getVibeStore() || {};
  if (!store[themeId] || !store[themeId].recipients) return false;

  const recipient = store[themeId].recipients.find(r => r.id === recipientId);
  if (!recipient) return false;
  if (!Array.isArray(recipient.letters)) recipient.letters = [];

  const existingIdx = recipient.letters.findIndex(l => l.id === letterData.id);
  if (existingIdx !== -1) {
    recipient.letters[existingIdx] = {
      ...recipient.letters[existingIdx],
      ...letterData
    };
  } else {
    const newId = letterData.id || `letter-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    recipient.letters.push({
      id: newId,
      ...letterData
    });
  }

  saveVibeStore(store);
  return true;
}

/**
 * QUẢN TRỊ (ADMIN): Xóa Lá thư
 */
export function adminDeleteLetter(themeId, recipientId, letterId) {
  const store = getVibeStore() || {};
  if (!store[themeId] || !store[themeId].recipients) return false;

  const recipient = store[themeId].recipients.find(r => r.id === recipientId);
  if (!recipient || !recipient.letters) return false;

  recipient.letters = recipient.letters.filter(l => l.id !== letterId);
  saveVibeStore(store);
  return true;
}
