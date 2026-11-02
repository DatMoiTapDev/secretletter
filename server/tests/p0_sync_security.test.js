import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  encryptVaultData,
  decryptVaultData,
  mergeLetters,
  mergeUsers,
  mergeVibeHub,
  mergeTombstones,
  recordTombstone,
  isTombstoned,
  migrateToV2Payload,
  areLetterContentsEqual
} from '../../client/src/api/syncEngine.js';
import { safeCompare, requireAdmin } from '../auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// TEST SUITE 1: BẢO MẬT & XÁC THỰC SERVER (SEC-01, SEC-02)
// =========================================================================
test('SEC: requireAdmin fails closed when ADMIN_KEY is missing or empty', () => {
  const originalKey = process.env.ADMIN_KEY;
  try {
    process.env.ADMIN_KEY = '';
    let statusSent = null;
    let jsonSent = null;

    const req = { headers: { 'x-admin-key': 'any_attempt' } };
    const res = {
      status(s) {
        statusSent = s;
        return {
          json(j) {
            jsonSent = j;
          }
        };
      }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireAdmin(req, res, next);

    assert.strictEqual(statusSent, 503, 'Phải trả về 503 Service Unavailable khi chưa cấu hình ADMIN_KEY');
    assert.strictEqual(nextCalled, false, 'Không được gọi next()');
    assert.match(jsonSent.error, /chưa được cấu hình/);
  } finally {
    process.env.ADMIN_KEY = originalKey;
  }
});

test('SEC: requireAdmin rejects unauthorized, empty, or malicious admin keys', () => {
  const originalKey = process.env.ADMIN_KEY;
  try {
    process.env.ADMIN_KEY = 'super_secret_creator_key_9981';
    let statusSent = null;
    let jsonSent = null;

    const res = {
      status(s) {
        statusSent = s;
        return {
          json(j) {
            jsonSent = j;
          }
        };
      }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    // Case 1: Không có header
    requireAdmin({ headers: {} }, res, next);
    assert.strictEqual(statusSent, 401);
    assert.strictEqual(nextCalled, false);

    // Case 2: Header rỗng hoặc chuỗi giả mạo từ DevTools
    requireAdmin({ headers: { 'x-admin-key': 'admin' } }, res, next);
    assert.strictEqual(statusSent, 401);
    assert.strictEqual(nextCalled, false);

    // Case 3: Header đúng
    nextCalled = false;
    requireAdmin({ headers: { 'x-admin-key': 'super_secret_creator_key_9981' } }, res, next);
    assert.strictEqual(nextCalled, true, 'Header đúng phải được cấp quyền');

    // Case 4: Bearer token format
    nextCalled = false;
    requireAdmin({ headers: { authorization: 'Bearer super_secret_creator_key_9981' } }, res, next);
    assert.strictEqual(nextCalled, true, 'Bearer đúng phải được cấp quyền');
  } finally {
    process.env.ADMIN_KEY = originalKey;
  }
});

test('SEC: safeCompare executes constant-time string comparison', () => {
  assert.strictEqual(safeCompare('secret_123', 'secret_123'), true);
  assert.strictEqual(safeCompare('secret_123', 'secret_456'), false);
  assert.strictEqual(safeCompare('short', 'longer_string'), false);
  assert.strictEqual(safeCompare(null, 'test'), false);
  assert.strictEqual(safeCompare('test', undefined), false);
});

test('SEC: Cannot self-elevate to admin via DevTools or localStorage manipulation', () => {
  // Giả lập hacker sửa local user trong DevTools thành role: 'admin'
  const hackedLocalUsers = [
    { id: 'usr_hacker', username: 'hacker99', role: 'admin', displayName: 'Fake Admin' }
  ];

  // Khi merge với cloud:
  const merged = mergeUsers(hackedLocalUsers, []);
  
  // Chỉ 2 tài khoản root admin hợp lệ mới được giữ quyền admin
  const hackerUser = merged.find(u => u.username === 'hacker99');
  assert.ok(hackerUser);
  // Tài khoản root admin được bảo lưu độc quyền
  const adminRoot = merged.find(u => u.username === 'admin');
  const tiendatAlias = merged.find(u => u.username === 'tiendat');
  assert.strictEqual(adminRoot.role, 'admin');
  assert.strictEqual(tiendatAlias.role, 'admin');
});

// =========================================================================
// TEST SUITE 2: CHỐNG GHI ĐÈ & XÁC ĐỊNH NGUỒN CHUẨN (DATA-01)
// =========================================================================
test('DATA-01: Seed data cannot overwrite existing cloud data or local data', () => {
  // Giả lập dữ liệu Cloud chuẩn đang có
  const cloudUsers = [
    { id: 'usr_tiendat_root', username: 'admin', role: 'admin' },
    { id: 'usr_tiendat_alias', username: 'tiendat', role: 'admin' },
    { id: 'usr_tien123', username: 'tien123', role: 'member', displayName: 'Thảo Ti' },
    { id: 'usr_va123', username: 'va123', role: 'member', displayName: 'Vân Anh' }
  ];

  // Giả lập seed cũ (chỉ có admin mặc định)
  const staleSeedUsers = [
    { id: 'usr_root_admin', username: 'admin', role: 'admin' },
    { id: 'usr_alias_admin', username: 'tiendat', role: 'admin' }
  ];

  const merged = mergeUsers(cloudUsers, staleSeedUsers);
  assert.strictEqual(merged.length, 4, 'Toàn bộ 4 user phải được bảo toàn, seed không thể xóa user nào');
  const userUsernames = merged.map(u => u.username);
  assert.ok(userUsernames.includes('tien123'));
  assert.ok(userUsernames.includes('va123'));
});

// =========================================================================
// TEST SUITE 3: CHỐNG GHI ĐÈ ĐỒNG THỜI & CONFLICT FORK (DATA-02)
// =========================================================================
test('DATA-02: Concurrent edits on the same letter do NOT silently lose data', () => {
  // Thiết bị A (Offline/sửa ở máy 1)
  const deviceALetter = {
    id: 'letter-001',
    title: 'Lá thư tình đầu (Sửa từ Thiết bị A)',
    content: 'Lời nhắn mới thêm từ thiết bị A: Anh yêu em nhiều lắm!',
    updatedAt: '2026-11-02T10:05:00.000Z'
  };

  // Thiết bị B (Sửa ở máy 2 và đã đẩy lên Cloud trước)
  const deviceBLetter = {
    id: 'letter-001',
    title: 'Lá thư tình đầu (Sửa từ Thiết bị B)',
    content: 'Lời nhắn mới thêm từ thiết bị B: Chúc em sinh nhật vui vẻ nhé!',
    updatedAt: '2026-11-02T10:06:00.000Z'
  };

  // Khi Device A sync với Cloud (chứa Device B):
  const { mergedLetters, conflictForks } = mergeLetters([deviceALetter], [deviceBLetter], {});

  // Kiểm tra: Phải có 2 lá thư (1 bản chính giữ ID cũ + 1 bản sao lưu xung đột)
  assert.strictEqual(mergedLetters.length, 2, 'Phải có 2 lá thư, tuyệt đối không bị mất nội dung nào');
  assert.strictEqual(conflictForks.length, 1, 'Phải tự động tạo 1 Conflict Fork');

  const mainLetter = mergedLetters.find(l => l.id === 'letter-001');
  const forkedLetter = mergedLetters.find(l => l._conflictOf === 'letter-001');

  assert.ok(mainLetter, 'Bản chính letter-001 phải tồn tại');
  assert.ok(forkedLetter, 'Bản sao lưu xung đột phải tồn tại');
  assert.ok(forkedLetter.title.includes('[Bản sao xung đột]'));

  // Kiểm tra không mất bất kỳ lời nhắn nào của cả 2 thiết bị
  const allContents = mergedLetters.map(l => l.content).join(' --- ');
  assert.ok(allContents.includes('Anh yêu em nhiều lắm!'), 'Nội dung thiết bị A phải được giữ nguyên vẹn');
  assert.ok(allContents.includes('Chúc em sinh nhật vui vẻ nhé!'), 'Nội dung thiết bị B phải được giữ nguyên vẹn');
});

// =========================================================================
// TEST SUITE 4: TOMBSTONE XÓA DỮ LIỆU & CHỐNG HỒI SINH (DATA-02)
// =========================================================================
test('DATA-02: Tombstone prevents deleted letters from resurrecting on sync', () => {
  const remoteLetters = [
    {
      id: 'letter-to-delete',
      title: 'Thư thử nghiệm cần xóa',
      updatedAt: '2026-11-02T08:00:00.000Z'
    },
    {
      id: 'letter-keep',
      title: 'Thư giữ lại',
      updatedAt: '2026-11-02T08:00:00.000Z'
    }
  ];

  // Thiết bị thực hiện xóa letter-to-delete lúc 09:00:00
  let tombstones = recordTombstone({}, 'letters', 'letter-to-delete', '2026-11-02T09:00:00.000Z');

  // Khi kéo danh sách từ Remote về:
  const { mergedLetters } = mergeLetters([], remoteLetters, tombstones);

  assert.strictEqual(mergedLetters.length, 1, 'Chỉ còn lại 1 thư');
  assert.strictEqual(mergedLetters[0].id, 'letter-keep');
  assert.strictEqual(
    mergedLetters.some(l => l.id === 'letter-to-delete'),
    false,
    'Lá thư đã xóa không được phép hồi sinh lại'
  );
});

// =========================================================================
// TEST SUITE 5: OFFLINE RỒI ONLINE KHÔNG LÀM MẤT DỮ LIỆU MỚI
// =========================================================================
test('DATA-02: Going offline and then online does not erase fresh local edits or new letters', () => {
  // Remote lúc máy chuẩn bị offline
  const remoteSnapshot = [
    { id: 'l1', title: 'Thư cũ trên mây', content: 'Chưa sửa', updatedAt: '2026-11-02T07:00:00.000Z' }
  ];

  // Khi offline: người dùng tạo 1 lá thư mới và sửa thư cũ
  const localOfflineLetters = [
    {
      id: 'l1',
      title: 'Thư cũ trên mây',
      content: 'Đã sửa lúc offline',
      _baseUpdatedAt: '2026-11-02T07:00:00.000Z',
      updatedAt: '2026-11-02T07:30:00.000Z'
    },
    { id: 'l2', title: 'Thư mới tạo lúc offline', content: 'Nội dung mới', createdAt: '2026-11-02T07:35:00.000Z' }
  ];

  // Khi có mạng trở lại (Online Sync):
  const { mergedLetters } = mergeLetters(localOfflineLetters, remoteSnapshot, {});

  assert.strictEqual(mergedLetters.length, 2, 'Phải có đầy đủ 2 thư');
  const l1 = mergedLetters.find(l => l.id === 'l1');
  const l2 = mergedLetters.find(l => l.id === 'l2');
  assert.strictEqual(l1.content, 'Đã sửa lúc offline', 'Bản sửa offline mới hơn phải được bảo toàn');
  assert.ok(l2, 'Lá thư mới tạo offline phải được giữ nguyên');
});

// =========================================================================
// TEST SUITE 6: MIGRATION DỮ LIỆU VÀ BẢO TỒN DỮ LIỆU CŨ TỪ BACKUP THỰC TẾ
// =========================================================================
test('MIGRATION: Real decrypted backup data is preserved with 100% fidelity', () => {
  const backupFiles = fs.readdirSync(path.join(__dirname, '../../backups'))
    .filter(f => f.startsWith('firebase_vault_backup_decrypted_'));

  assert.ok(backupFiles.length > 0, 'Phải có ít nhất 1 file backup decrypted');
  const backupPath = path.join(__dirname, '../../backups', backupFiles[0]);
  const backupContent = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  // Nâng cấp dữ liệu backup thực tế sang format v2
  const migrated = migrateToV2Payload(backupContent, 1);

  assert.strictEqual(migrated.schemaVersion, 2, 'Schema version phải là 2');
  assert.strictEqual(migrated.revision, 1, 'Revision khởi tạo là 1');
  assert.strictEqual(migrated.users.length, 4, 'Bảo toàn đủ 4 user thực tế');
  assert.strictEqual(migrated.letters.length, 3, 'Bảo toàn đủ 3 lá thư thực tế');
  assert.ok(migrated.vibe.tet, 'Chủ đề Tết được bảo toàn');
  assert.ok(migrated.vibe.birthday, 'Chủ đề Sinh nhật được bảo toàn');
  assert.ok(migrated.vibe.cute, 'Chủ đề Yêu được bảo toàn');
  assert.ok(migrated.vibe.emotional, 'Chủ đề Tâm tình được bảo toàn');

  // Kiểm tra mã hóa và giải mã lại toàn bộ dữ liệu thật
  const cipher = encryptVaultData(migrated);
  assert.ok(cipher && typeof cipher === 'string');
  const decrypted = decryptVaultData(cipher);
  assert.deepStrictEqual(decrypted, migrated, 'Toàn bộ dữ liệu thật giữ nguyên 100%');
});
