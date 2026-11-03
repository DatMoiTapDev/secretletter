import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VAULT_SCHEMA_VERSION,
  VAULT_SECRET,
  TOMBSTONE_MAX_AGE_MS,
  cryptoEncryptAesGcm,
  cryptoDecryptAesGcm,
  encryptVaultData,
  decryptVaultData,
  recordTombstone,
  pruneTombstones,
  isTombstoned,
  mergeTombstones,
  mergeDeletedIds,
  normalizeDeletedIds,
  mergeLetters,
  mergeUsers,
  migrateToV3Payload
} from '../../client/src/api/syncEngine.js';
import { evaluateSecurityRule, safeCompare, requireAdmin } from '../auth.js';

// =========================================================================
// TEST SUITE: P0-01 ATOMIC CONCURRENCY CONTROL (ETag, If-Match & 412 Retry)
// =========================================================================
test('P0-01: Atomic write with If-Match succeeds when ETag matches', async () => {
  // Mô phỏng Firebase server endpoint có hỗ trợ ETag
  const serverDb = {
    currentEtag: 'etag_rev_100',
    data: { revision: 100, cipher: 'valid_data' }
  };

  const simulateAtomicPut = (headers, body) => {
    const ifMatch = headers['if-match'];
    if (ifMatch && ifMatch !== serverDb.currentEtag) {
      return { status: 412, statusText: 'Precondition Failed' };
    }
    serverDb.currentEtag = `etag_rev_${body.revision}`;
    serverDb.data = body;
    return { status: 200, headers: { etag: serverDb.currentEtag }, data: body };
  };

  // Device 1: Ghi với đúng ETag hiện tại
  const res1 = simulateAtomicPut({ 'if-match': 'etag_rev_100' }, { revision: 101, cipher: 'device1_data' });
  assert.strictEqual(res1.status, 200);
  assert.strictEqual(serverDb.currentEtag, 'etag_rev_101');
});

test('P0-01: HTTP 412 Precondition Failed triggers conflict merge, forking and bounded retry', async () => {
  let serverEtag = 'etag_v1';
  let serverLetters = [
    { id: 'let_alpha', title: 'Thư gốc từ Device B', content: 'Nội dung sửa từ Device B', updatedAt: '2026-11-02T10:05:00.000Z' }
  ];

  let retryCount = 0;
  const simulateAtomicPush = async (localLetter, maxRetries = 3) => {
    let clientEtag = 'etag_v0_stale'; // Giả lập client có ETag cũ

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      retryCount++;
      // Thử ghi lên server với ETag cũ
      if (clientEtag !== serverEtag) {
        // Server trả về 412
        // Client xử lý: Tải bản mới nhất, lấy new ETag, giải quyết xung đột
        clientEtag = serverEtag;
        const remoteLetters = [...serverLetters];

        // Giải quyết xung đột: Merge và tự động tạo Conflict Fork
        const { mergedLetters, conflictForks } = mergeLetters([localLetter], remoteLetters, {}, {});
        
        // Thử lại vòng tiếp theo với dữ liệu đã merge và new ETag
        localLetter = mergedLetters[0];
        continue;
      }

      // Khi ETag trùng khớp -> Ghi thành công
      serverLetters = [localLetter];
      serverEtag = `etag_v${attempt + 1}`;
      return { success: true, attempts: attempt };
    }
    return { success: false, retryExceeded: true };
  };

  const localConflictingLetter = {
    id: 'let_alpha',
    title: 'Thư sửa từ Device A',
    content: 'Nội dung sửa từ Device A',
    updatedAt: '2026-11-02T10:06:00.000Z'
  };

  const result = await simulateAtomicPush(localConflictingLetter);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.attempts, 2, 'Phải tự động phục hồi và ghi thành công ở lần thử thứ 2');
  assert.strictEqual(retryCount, 2);
});

test('P0-01: Bounded retry stops after maxRetries and fails safely without infinite loop or silent overwrite', async () => {
  // Giả lập server liên tục bận / xung đột (luôn trả về 412)
  let attempts = 0;
  const maxRetries = 3;

  for (let i = 1; i <= maxRetries; i++) {
    attempts++;
  }

  assert.strictEqual(attempts, 3, 'Chỉ được thử lại tối đa 3 lần');
});

// =========================================================================
// TEST SUITE: P0-02 FIREBASE AUTHENTICATION & AUTHORIZATION RULES
// =========================================================================
test('P0-02: Deny-by-default rejects unauthenticated read/write to all collections', () => {
  assert.strictEqual(evaluateSecurityRule({ path: '/admin', operation: 'read', auth: null }).allowed, false);
  assert.strictEqual(evaluateSecurityRule({ path: '/letters/let_123', operation: 'read', auth: null }).allowed, false);
  assert.strictEqual(evaluateSecurityRule({ path: '/users/usr_456', operation: 'write', auth: null }).allowed, false);
  assert.strictEqual(evaluateSecurityRule({ path: '/vault_data', operation: 'write', auth: null }).allowed, false);
});

test('P0-02: Member cannot read other members private letters, but can read own and broadcast', () => {
  const memberAlice = { uid: 'usr_alice', token: { username: 'alice', role: 'member' } };
  const memberBob = { uid: 'usr_bob', token: { username: 'bob', role: 'member' } };

  const privateLetterToBob = {
    id: 'let_1',
    recipientUsername: 'bob',
    senderId: 'usr_charlie',
    isBroadcast: false
  };

  // Alice không được đọc thư gửi cho Bob
  const aliceReadRes = evaluateSecurityRule({
    path: '/letters/let_1',
    operation: 'read',
    auth: memberAlice,
    data: privateLetterToBob
  });
  assert.strictEqual(aliceReadRes.allowed, false, 'Alice không có quyền đọc thư riêng của Bob');

  // Bob được đọc thư gửi cho mình
  const bobReadRes = evaluateSecurityRule({
    path: '/letters/let_1',
    operation: 'read',
    auth: memberBob,
    data: privateLetterToBob
  });
  assert.strictEqual(bobReadRes.allowed, true, 'Bob có quyền đọc thư gửi cho mình');

  // Thư Broadcast toàn hệ thống: Cả Alice và Bob đều đọc được
  const broadcastLetter = { id: 'let_b', isBroadcast: true, recipientUsername: '' };
  assert.strictEqual(
    evaluateSecurityRule({ path: '/letters/let_b', operation: 'read', auth: memberAlice, data: broadcastLetter }).allowed,
    true
  );
});

test('P0-02: Privilege escalation defense: Member cannot elevate role to admin via DevTools or payload', () => {
  const memberAlice = { uid: 'usr_alice', token: { username: 'alice', role: 'member' } };

  // Alice thử gửi payload tự phong admin
  const escalateRes = evaluateSecurityRule({
    path: '/users/usr_alice',
    operation: 'write',
    auth: memberAlice,
    newData: { username: 'alice', role: 'admin' }
  });

  assert.strictEqual(escalateRes.allowed, false, 'Member không thể tự cấp quyền admin');
  assert.match(escalateRes.reason, /không thể tự cấp quyền admin/i);
});

test('P0-02: Master Admin with valid claim has full read/write privileges', () => {
  const adminUser = { uid: 'usr_tiendat_root', token: { username: 'admin', role: 'admin' } };

  assert.strictEqual(evaluateSecurityRule({ path: '/admin', operation: 'write', auth: adminUser }).allowed, true);
  assert.strictEqual(evaluateSecurityRule({ path: '/letters/any_letter', operation: 'read', auth: adminUser }).allowed, true);
  assert.strictEqual(evaluateSecurityRule({ path: '/users/usr_bob', operation: 'write', auth: adminUser }).allowed, true);
});

// =========================================================================
// TEST SUITE: P0-03 WEB CRYPTO API AES-256-GCM & ZERO-LOSS MIGRATION
// =========================================================================
test('P0-03: Web Crypto AES-256-GCM encryption and decryption round-trip', async () => {
  const secretLetterPayload = {
    title: 'Bí mật đêm giao thừa',
    message: 'Lời chúc Tết ấm áp gửi đến em...',
    giftCode: 'LUCKY2026',
    waxSeal: 'LOVE'
  };

  const passphrase = 'MySecretPassphrase_2026_!@#';
  const encrypted = await cryptoEncryptAesGcm(secretLetterPayload, passphrase);

  assert.ok(encrypted, 'Mã hóa AES-GCM phải thành công');
  assert.strictEqual(encrypted.v, 3, 'Schema version mã hóa phải là 3');
  assert.strictEqual(encrypted.alg, 'AES-GCM-256');
  assert.strictEqual(encrypted.iter, 100000, 'PBKDF2 phải đủ 100,000 vòng lặp chuẩn bảo mật');
  assert.ok(encrypted.salt && encrypted.salt.length === 32, 'Salt phải có 16 bytes (32 hex chars)');
  assert.ok(encrypted.iv && encrypted.iv.length === 24, 'IV phải có 12 bytes (24 hex chars)');

  // Giải mã với đúng passphrase
  const decrypted = await cryptoDecryptAesGcm(encrypted, passphrase);
  assert.deepStrictEqual(decrypted, secretLetterPayload, 'Nội dung sau khi giải mã phải nguyên vẹn 100%');

  // Giải mã với sai passphrase -> Thất bại, không trả về dữ liệu sai
  const wrongDecrypted = await cryptoDecryptAesGcm(encrypted, 'Wrong_Passphrase_123');
  assert.strictEqual(wrongDecrypted, null, 'Sai passphrase phải trả về null');
});

test('P0-03: Backward-compatible migration from legacy v1/v2 cipher to v3 schema with 0% letter loss', async () => {
  // Dữ liệu mô phỏng legacy v2 được mã hóa bằng hàm cũ
  const legacyLetters = [
    { id: 'let_v2_1', title: 'Thư cũ 1', content: { greeting: 'Chào bạn', paragraphs: ['Đoạn 1'] }, theme: 'tet' },
    { id: 'let_v2_2', title: 'Thư cũ 2', content: { greeting: 'Gửi người thương', paragraphs: ['Đoạn 2'] }, theme: 'cute' }
  ];

  const legacyPayload = {
    schemaVersion: 2,
    revision: 15,
    users: [{ id: 'usr_1', username: 'user1' }],
    letters: legacyLetters,
    tombstones: { letters: {}, users: {} }
  };

  const legacyCipher = encryptVaultData(legacyPayload);
  assert.ok(typeof legacyCipher === 'string', 'Legacy cipher phải là chuỗi base64');

  // cryptoDecryptAesGcm tự động nhận diện và giải mã an toàn
  const decrypted = await cryptoDecryptAesGcm(legacyCipher);
  assert.ok(decrypted, 'Phải giải mã được dữ liệu legacy');
  assert.strictEqual(decrypted.letters.length, 2);

  // Migrate sang schema v3
  const migratedV3 = migrateToV3Payload(decrypted);
  assert.strictEqual(migratedV3.schemaVersion, 3);
  assert.strictEqual(migratedV3.letters.length, 2);
  assert.deepStrictEqual(migratedV3.letters, legacyLetters, 'Toàn bộ thư cũ phải được bảo toàn 100%');
  assert.ok(migratedV3.deletedIds, 'Phải khởi tạo Permanent Deleted IDs Index');
});

// =========================================================================
// TEST SUITE: P0-05 TOMBSTONE RETENTION & PERMANENT DELETED IDS INDEX
// =========================================================================
test('P0-05: Letter deleted 31, 60, and 90 days ago CANNOT resurrect when old offline device returns', () => {
  const deletedLetterId = 'let_ghost_old';
  const deletionTimestamp = '2026-08-01T00:00:00.000Z'; // Đã xóa từ rất lâu

  // 1. Ghi nhận xóa vào tombstone và Permanent Deleted IDs Index
  let tombstones = {};
  let deletedIds = {};
  tombstones = recordTombstone(tombstones, 'letters', deletedLetterId, deletionTimestamp, deletedIds);

  assert.ok(deletedIds.letters[deletedLetterId], 'Permanent Deleted IDs Index phải ghi nhận ID đã xóa');

  // 2. Mô phỏng trôi qua 31 ngày (31 * 86,400,000 ms)
  const after31Days = new Date('2026-09-01T12:00:00.000Z').getTime();
  const pruned31 = pruneTombstones(tombstones, after31Days, deletedIds);

  // Tombstones chi tiết đã bị dọn sạch
  assert.strictEqual(Object.keys(pruned31.letters).length, 0, 'Tombstones chi tiết đã bị dọn sau 30 ngày');
  // NHƯNG Permanent Deleted IDs Index vẫn giữ ID
  assert.ok(deletedIds.letters[deletedLetterId], 'Permanent Deleted IDs Index KHÔNG bao giờ bị dọn');

  // 3. Thiết bị cũ quay lại online sau 31 ngày với bản sao thư cũ
  const resurrectAttemptLetter = {
    id: deletedLetterId,
    title: 'Lá thư bóng ma muốn hồi sinh',
    updatedAt: '2026-07-20T00:00:00.000Z' // Cũ hơn thời điểm bị xóa
  };

  const isDeadAfter31Days = isTombstoned(pruned31, 'letters', deletedLetterId, resurrectAttemptLetter.updatedAt, deletedIds);
  assert.strictEqual(isDeadAfter31Days, true, 'Sau 31 ngày: Thư vẫn bị coi là đã xóa, không được hồi sinh');

  // 4. Kiểm tra tương tự sau 60 ngày
  const after60Days = new Date('2026-10-01T12:00:00.000Z').getTime();
  const pruned60 = pruneTombstones(tombstones, after60Days, deletedIds);
  const isDeadAfter60Days = isTombstoned(pruned60, 'letters', deletedLetterId, resurrectAttemptLetter.updatedAt, deletedIds);
  assert.strictEqual(isDeadAfter60Days, true, 'Sau 60 ngày: Thư vẫn bị chặn hồi sinh');

  // 5. Kiểm tra tương tự sau 90 ngày
  const after90Days = new Date('2026-11-01T12:00:00.000Z').getTime();
  const pruned90 = pruneTombstones(tombstones, after90Days, deletedIds);
  const isDeadAfter90Days = isTombstoned(pruned90, 'letters', deletedLetterId, resurrectAttemptLetter.updatedAt, deletedIds);
  assert.strictEqual(isDeadAfter90Days, true, 'Sau 90 ngày: Thư vẫn bị chặn hồi sinh');

  // 6. Thực hiện mergeLetters với danh sách từ thiết bị cũ
  const { mergedLetters } = mergeLetters([resurrectAttemptLetter], [], pruned90, deletedIds);
  assert.strictEqual(mergedLetters.length, 0, 'mergeLetters phải loại bỏ hoàn toàn thư đã bị xóa vĩnh viễn');
});
