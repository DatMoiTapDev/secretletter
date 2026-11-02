import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VAULT_SCHEMA_VERSION,
  cryptoEncryptAesGcm,
  cryptoDecryptAesGcm,
  mergeLetters,
  mergeUsers,
  mergeTombstones,
  recordTombstone,
  isTombstoned
} from '../../client/src/api/syncEngine.js';
import { hashPassword, verifyPassword, safeCompare } from '../auth.js';

// =========================================================================
// REGRESSION TEST SUITE: FULL SYSTEM LIFECYCLE (ADMIN, MEMBER, LETTERS, LOCKS)
// =========================================================================

test('REGRESSION 1: Admin & Member Login / Authentication Flow', async () => {
  // Test password hashing and verification
  const plainPassword = 'SecretMember_Pass2026!';
  const hashedPassword = await hashPassword(plainPassword);

  assert.ok(hashedPassword && hashedPassword.startsWith('$2'), 'Mật khẩu phải được băm an toàn bằng bcrypt');
  assert.strictEqual(await verifyPassword(plainPassword, hashedPassword), true, 'Đăng nhập đúng mật khẩu phải thành công');
  assert.strictEqual(await verifyPassword('WrongPassword', hashedPassword), false, 'Đăng nhập sai mật khẩu phải bị từ chối');

  // Thử thư không đặt mật khẩu
  assert.strictEqual(await verifyPassword('', ''), true, 'Thư không mật khẩu verify ra true');
});

test('REGRESSION 2: Member Account Creation & Role Integrity', () => {
  const users = [
    { id: 'usr_tiendat_root', username: 'admin', role: 'admin', status: 'active' },
    { id: 'usr_alice', username: 'alice', role: 'member', status: 'active' }
  ];

  // Thêm thành viên mới
  const newUser = { id: 'usr_charlie', username: 'charlie', role: 'member', status: 'active', createdAt: new Date().toISOString() };
  const merged = mergeUsers(users, [newUser], {}, {});

  assert.strictEqual(merged.length, 4, 'Danh sách phải có đủ 4 user (2 root admin + 2 member)');
  const charlie = merged.find(u => u.username === 'charlie');
  assert.ok(charlie);
  assert.strictEqual(charlie.role, 'member', 'Tài khoản tạo mới không được có quyền admin');
});

test('REGRESSION 3: Letter Lifecycle — Compose, Save, 2-Tier Lock, Share & Unlock', async () => {
  // 1. Soạn thư
  const letter = {
    id: 'let_test_journey_01',
    slug: 'let-test-journey-01',
    senderId: 'usr_alice',
    senderUsername: 'alice',
    recipientName: 'Bảo Thy',
    recipientUsername: 'baothy',
    title: 'Gửi ngàn lời chúc',
    theme: 'tet',
    hasPassword: true,
    password: 'baothy_traitim_2026',
    passwordHint: 'Tên bạn + biểu tượng tình yêu',
    content: {
      greeting: 'Gửi Bảo Thy thân mến,',
      paragraphs: ['Mùa xuân năm nay thật đặc biệt...', 'Chúc bạn luôn an yên và rạng rỡ.'],
      quotes: []
    },
    photos: [{ url: 'data:image/jpeg;base64,mock', caption: 'Kỷ niệm Đà Lạt' }],
    secretUnsaid: { enabled: true, content: 'Mình luôn nhớ nụ cười của bạn.' },
    finalThought: { enabled: true, content: 'Hẹn gặp lại bạn vào một ngày xuân ấm áp.' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 2. Mã hóa bằng AES-GCM
  const encryptedLetter = await cryptoEncryptAesGcm(letter, letter.password);
  assert.ok(encryptedLetter && encryptedLetter.v === 3);

  // 3. Mở khóa tầng 1 (truy cập phong bì) & Tầng 2 (nhập mật khẩu mở thư)
  const failedUnlock = await cryptoDecryptAesGcm(encryptedLetter, 'wrong_pass');
  assert.strictEqual(failedUnlock, null, 'Sai mật khẩu tầng 2 không thể giải mã');

  const successfulUnlock = await cryptoDecryptAesGcm(encryptedLetter, letter.password);
  assert.ok(successfulUnlock);
  assert.strictEqual(successfulUnlock.title, letter.title);
  assert.strictEqual(successfulUnlock.content.paragraphs.length, 2);
  assert.strictEqual(successfulUnlock.secretUnsaid.content, 'Mình luôn nhớ nụ cười của bạn.');
});

test('REGRESSION 4: Letter Editing, Concurrent Edits & Conflict Forking', () => {
  const originalLetter = {
    id: 'let_concurrent_01',
    title: 'Bản gốc',
    content: 'Nội dung ban đầu',
    updatedAt: '2026-11-02T10:00:00.000Z'
  };

  // Thiết bị 1 sửa
  const dev1Letter = {
    ...originalLetter,
    title: 'Bản sửa từ Device 1',
    updatedAt: '2026-11-02T10:01:00.000Z'
  };

  // Thiết bị 2 sửa đồng thời
  const dev2Letter = {
    ...originalLetter,
    title: 'Bản sửa từ Device 2',
    updatedAt: '2026-11-02T10:02:00.000Z'
  };

  const { mergedLetters, conflictForks } = mergeLetters([dev1Letter], [dev2Letter], {}, {});

  assert.strictEqual(mergedLetters.length, 2, 'Không được ghi đè mất thư, phải có 2 thư');
  assert.strictEqual(conflictForks.length, 1, 'Phải tự động tạo đúng 1 bản sao xung đột [Bản sao xung đột]');
  assert.ok(conflictForks[0].title.includes('[Bản sao xung đột]'));
});

test('REGRESSION 5: Letter Deletion, Tombstone Persistence & Resurrection Defense', () => {
  const letters = [
    { id: 'let_active_1', title: 'Thư đang mở' },
    { id: 'let_to_delete', title: 'Thư cần xóa' }
  ];

  let tombstones = {};
  let deletedIds = {};

  // Xóa thư 'let_to_delete'
  tombstones = recordTombstone(tombstones, 'letters', 'let_to_delete', new Date().toISOString(), deletedIds);

  const { mergedLetters } = mergeLetters(letters, [], tombstones, deletedIds);
  assert.strictEqual(mergedLetters.length, 1, 'Thư bị xóa không được xuất hiện');
  assert.strictEqual(mergedLetters[0].id, 'let_active_1');

  // Giả lập thiết bị offline 90 ngày sau đó gửi lại 'let_to_delete'
  const oldOfflineLetters = [{ id: 'let_to_delete', title: 'Thư cần xóa', updatedAt: '2026-08-01T00:00:00.000Z' }];
  const resurrectCheck = mergeLetters(oldOfflineLetters, [], {}, deletedIds);
  assert.strictEqual(resurrectCheck.mergedLetters.length, 0, 'Permanent Deleted IDs Index phải chặn thư hồi sinh');
});
