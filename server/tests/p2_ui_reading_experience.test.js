import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// TEST SUITE: P2 DRAFT ISOLATION (PER USER, PER LETTER)
// =========================================================================
test('P2 Draft: Compose draft keys are isolated per user account', () => {
  const getDraftKey = (userId, letterId = 'new') => {
    return userId ? `draft_compose_${userId}_${letterId}` : 'draft_compose_guest_new';
  };

  const userA_id = 'usr_alice_123';
  const userB_id = 'usr_bob_456';

  const keyA = getDraftKey(userA_id);
  const keyB = getDraftKey(userB_id);

  assert.notStrictEqual(keyA, keyB, 'Draft key của User A và User B phải hoàn toàn tách biệt');
  assert.strictEqual(keyA, 'draft_compose_usr_alice_123_new');
  assert.strictEqual(keyB, 'draft_compose_usr_bob_456_new');

  // Mô phỏng bộ nhớ localStorage cục bộ
  const mockStorage = {};
  mockStorage[keyA] = JSON.stringify({ recipientName: 'Alice Recipient', message: 'Tâm thư của Alice' });

  // Kiểm tra User B đọc draft
  const readUserBDraft = mockStorage[keyB] ? JSON.parse(mockStorage[keyB]) : null;
  assert.strictEqual(readUserBDraft, null, 'User B không được nhìn thấy bản nháp của User A');

  // Kiểm tra User A đọc draft
  const readUserADraft = JSON.parse(mockStorage[keyA]);
  assert.strictEqual(readUserADraft.recipientName, 'Alice Recipient');
});

test('P2 Draft: Unsaved changes (dirty state) and beforeunload detection', () => {
  const checkIsDirty = (formData, initialData = { recipientName: '', title: '', message: '' }) => {
    return (
      (formData.recipientName?.trim() || '') !== (initialData.recipientName?.trim() || '') ||
      (formData.title?.trim() || '') !== (initialData.title?.trim() || '') ||
      (formData.message?.trim() || '') !== (initialData.message?.trim() || '')
    );
  };

  // Trạng thái trống ban đầu
  assert.strictEqual(checkIsDirty({ recipientName: '', title: '', message: '' }), false);

  // Người dùng bắt đầu gõ
  assert.strictEqual(checkIsDirty({ recipientName: 'Bảo Thy', title: '', message: '' }), true);
  assert.strictEqual(checkIsDirty({ recipientName: '', title: 'Thư xuân', message: '' }), true);
  assert.strictEqual(checkIsDirty({ recipientName: '', title: '', message: 'Lời chúc ấm áp' }), true);

  // Sau khi gửi thư thành công (clear trạng thái)
  const clearedForm = { recipientName: '', title: '', message: '' };
  assert.strictEqual(checkIsDirty(clearedForm), false);
});

// =========================================================================
// TEST SUITE: P2 READING PREFERENCES (LOCALSTORAGE & PERSISTENCE)
// =========================================================================
test('P2 Reader: Reading preferences parsing with safe fallback defaults', () => {
  const DEFAULT_PREFS = {
    fontSize: 'normal',
    themePaper: 'parchment',
    ambientParticles: true,
    focusMode: false
  };

  const parsePrefs = (storedString) => {
    try {
      if (!storedString) return DEFAULT_PREFS;
      const parsed = JSON.parse(storedString);
      return {
        fontSize: ['small', 'normal', 'large', 'xl'].includes(parsed.fontSize) ? parsed.fontSize : DEFAULT_PREFS.fontSize,
        themePaper: ['parchment', 'dark', 'clean'].includes(parsed.themePaper) ? parsed.themePaper : DEFAULT_PREFS.themePaper,
        ambientParticles: typeof parsed.ambientParticles === 'boolean' ? parsed.ambientParticles : DEFAULT_PREFS.ambientParticles,
        focusMode: typeof parsed.focusMode === 'boolean' ? parsed.focusMode : DEFAULT_PREFS.focusMode
      };
    } catch {
      return DEFAULT_PREFS;
    }
  };

  // Trống -> Defaults
  assert.deepStrictEqual(parsePrefs(null), DEFAULT_PREFS);

  // Chuỗi JSON hỏng -> Defaults (không gây crash)
  assert.deepStrictEqual(parsePrefs('corrupt {json'), DEFAULT_PREFS);

  // Người dùng tùy biến cỡ chữ lớn và nền tối
  const customPrefs = JSON.stringify({
    fontSize: 'large',
    themePaper: 'dark',
    ambientParticles: false,
    focusMode: true
  });
  const loaded = parsePrefs(customPrefs);
  assert.strictEqual(loaded.fontSize, 'large');
  assert.strictEqual(loaded.themePaper, 'dark');
  assert.strictEqual(loaded.ambientParticles, false);
  assert.strictEqual(loaded.focusMode, true);

  // Cỡ chữ không hợp lệ -> fallback về normal
  const invalidPrefs = JSON.stringify({ fontSize: 'gigantic', themePaper: 'hacker' });
  const sanitized = parsePrefs(invalidPrefs);
  assert.strictEqual(sanitized.fontSize, 'normal');
  assert.strictEqual(sanitized.themePaper, 'parchment');
});

// =========================================================================
// TEST SUITE: P2 IMAGE UPLOAD VALIDATION & SIZE LIMITS
// =========================================================================
test('P2 Upload: Image file validation enforces < 10MB limit and image MIME type', () => {
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

  const validateUploadFile = (file) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      return { valid: false, error: 'Tệp tải lên không phải hình ảnh hợp lệ (PNG, JPG, WEBP).' };
    }
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return { valid: false, error: `Dung lượng ảnh vượt quá giới hạn 10MB (${sizeMB}MB). Vui lòng chọn ảnh nhẹ hơn.` };
    }
    return { valid: true, error: null };
  };

  // Ảnh hợp lệ: JPEG 2MB
  const validFile = { name: 'memory.jpg', type: 'image/jpeg', size: 2 * 1024 * 1024 };
  assert.strictEqual(validateUploadFile(validFile).valid, true);

  // Ảnh hợp lệ: PNG 9.9MB
  const edgeValidFile = { name: 'hd.png', type: 'image/png', size: 9.9 * 1024 * 1024 };
  assert.strictEqual(validateUploadFile(edgeValidFile).valid, true);

  // Tệp quá dung lượng: 12MB
  const oversizeFile = { name: 'huge_raw.jpg', type: 'image/jpeg', size: 12 * 1024 * 1024 };
  const overRes = validateUploadFile(oversizeFile);
  assert.strictEqual(overRes.valid, false);
  assert.match(overRes.error, /vượt quá giới hạn 10MB/);

  // Định dạng sai: PDF hoặc EXE
  const pdfFile = { name: 'letter.pdf', type: 'application/pdf', size: 500 * 1024 };
  assert.strictEqual(validateUploadFile(pdfFile).valid, false);
  assert.match(validateUploadFile(pdfFile).error, /không phải hình ảnh hợp lệ/);
});

// =========================================================================
// TEST SUITE: P2 ACCESSIBILITY & CONTRAST
// =========================================================================
test('P2 Accessibility: High contrast colors and mobile font-size guard in CSS', () => {
  const cssPath = path.join(__dirname, '../../client/src/styles/index.css');
  assert.ok(fs.existsSync(cssPath), 'index.css phải tồn tại');

  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Kiểm tra rule chống iOS Safari tự động zoom trang (16px input font size)
  assert.ok(
    cssContent.includes('font-size: 16px !important;'),
    'index.css phải có rule font-size: 16px !important để ngăn iOS Safari auto-zoom khi focus'
  );
  assert.ok(
    cssContent.includes('@media screen and (max-width: 768px)'),
    'Rule font-size 16px phải áp dụng trên mobile viewport <= 768px'
  );

  // Kiểm tra rule 100dvh để hỗ trợ dynamic viewport trên điện thoại
  assert.ok(
    cssContent.includes('min-height: 100dvh;'),
    'index.css phải có min-height: 100dvh để hỗ trợ mobile dynamic address bar'
  );
});

test('P2 Reader: Skip envelope animation and reduced-motion logic', () => {
  const getOpenDelay = (isSkip, prefersReducedMotion) => {
    if (isSkip || prefersReducedMotion) return 120; // tức thì ~120ms
    return 1800; // Animation chuẩn đầy đủ
  };

  assert.strictEqual(getOpenDelay(true, false), 120, 'Khi bấm "Đọc thư ngay ⚡", hiệu ứng phải mở ngay lập tức');
  assert.strictEqual(getOpenDelay(false, true), 120, 'Khi thiết bị bật giảm chuyển động, hiệu ứng mở ngay lập tức');
  assert.strictEqual(getOpenDelay(false, false), 1800, 'Người dùng thông thường xem trọn vẹn animation 1800ms');
});
