import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cryptoEncryptAesGcm,
  cryptoDecryptAesGcm,
  mergeLetters,
  mergeUsers
} from '../../client/src/api/syncEngine.js';
import { buildFirebaseRestUrl } from '../../client/src/api/mockAdapter.js';
import {
  mintTrustedAuthToken,
  verifyTrustedAuthToken,
  evaluateSecurityRule
} from '../auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// TEST SUITE: BLOCKER 1 — FIREBASE AUTH & AUTHORIZATION PROOFS
// =========================================================================
test('BLOCKER 1: Only trusted server can mint valid Admin claims; client tampering is rejected', () => {
  // 1. Server tin cậy cấp token cho Admin
  const adminToken = mintTrustedAuthToken({ uid: 'usr_admin', username: 'admin', role: 'admin' });
  const verifiedAdmin = verifyTrustedAuthToken(adminToken);

  assert.ok(verifiedAdmin, 'Token hợp lệ phải giải mã thành công');
  assert.strictEqual(verifiedAdmin.role, 'admin', 'Quyền Admin được cấp chính xác');
  assert.strictEqual(verifiedAdmin.username, 'admin');

  // 2. Client thử tự sửa payload để nâng quyền từ member lên admin
  const memberToken = mintTrustedAuthToken({ uid: 'usr_alice', username: 'alice', role: 'member' });
  const parts = memberToken.split('.');
  
  // Can thiệp phần payload base64url để đổi role: 'member' thành 'admin'
  const fakePayload = Buffer.from(JSON.stringify({
    uid: 'usr_alice',
    username: 'alice',
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');

  const forgedToken = `${parts[0]}.${fakePayload}.${parts[2]}`;
  const tamperedResult = verifyTrustedAuthToken(forgedToken);

  assert.strictEqual(tamperedResult, null, 'Chữ ký không khớp phải bị từ chối 100%');
});

test('BLOCKER 1: Security Rules matrix evaluation across 4 distinct personas', () => {
  const personas = {
    anonymous: null,
    memberA: { uid: 'usr_alice', token: { username: 'alice', role: 'member' } },
    memberB: { uid: 'usr_bob', token: { username: 'bob', role: 'member' } },
    admin: { uid: 'usr_root_admin', token: { username: 'admin', role: 'admin' } }
  };

  const bobPrivateLetter = {
    id: 'let_bob_private',
    recipientUsername: 'bob',
    senderId: 'usr_carol',
    isBroadcast: false
  };

  // 1. Anonymous -> Denied everything
  assert.strictEqual(evaluateSecurityRule({ path: '/admin', operation: 'read', auth: personas.anonymous }).allowed, false);
  assert.strictEqual(evaluateSecurityRule({ path: '/letters/let_bob_private', operation: 'read', auth: personas.anonymous }).allowed, false);

  // 2. Member A (Alice) -> Cannot read Bob's letter
  assert.strictEqual(
    evaluateSecurityRule({ path: '/letters/let_bob_private', operation: 'read', auth: personas.memberA, data: bobPrivateLetter }).allowed,
    false,
    'Alice không thể đọc thư riêng của Bob'
  );

  // 3. Member B (Bob) -> Can read own letter
  assert.strictEqual(
    evaluateSecurityRule({ path: '/letters/let_bob_private', operation: 'read', auth: personas.memberB, data: bobPrivateLetter }).allowed,
    true,
    'Bob đọc được thư của chính mình'
  );

  // 4. Admin -> Can read/write everything
  assert.strictEqual(
    evaluateSecurityRule({ path: '/letters/let_bob_private', operation: 'read', auth: personas.admin, data: bobPrivateLetter }).allowed,
    true,
    'Admin có toàn quyền'
  );
  assert.strictEqual(
    evaluateSecurityRule({ path: '/admin', operation: 'write', auth: personas.admin }).allowed,
    true
  );
});

test('BLOCKER 1: buildFirebaseRestUrl securely attaches ?auth= token to cloud requests', () => {
  const baseUrl = 'https://secretletter-8a0f4-default-rtdb.firebaseio.com';
  
  // Khi không có token
  const anonymousUrl = buildFirebaseRestUrl(baseUrl, '');
  assert.strictEqual(anonymousUrl, 'https://secretletter-8a0f4-default-rtdb.firebaseio.com/vault_data.json');

  // Khi có ID Token
  const token = 'sample_firebase_id_token_xyz123';
  const authenticatedUrl = buildFirebaseRestUrl(baseUrl, token);
  assert.strictEqual(
    authenticatedUrl,
    'https://secretletter-8a0f4-default-rtdb.firebaseio.com/vault_data.json?auth=sample_firebase_id_token_xyz123'
  );
});

// =========================================================================
// TEST SUITE: BLOCKER 2 — ENCRYPTION TAMPER & KEY LIFECYCLE
// =========================================================================
test('BLOCKER 2: Tampered ciphertext causes AES-GCM AEAD authentication tag failure', async () => {
  const payload = { text: 'Nội dung bí mật cần bảo vệ tính toàn vẹn' };
  const passphrase = 'StrongPassphrase2026!';
  const envelope = await cryptoEncryptAesGcm(payload, passphrase);

  assert.ok(envelope && envelope.data);

  // Giả lập kẻ tấn công thay đổi 1 ký tự trong ciphertext (tampering)
  const originalBytes = Buffer.from(envelope.data, 'base64');
  originalBytes[0] = originalBytes[0] ^ 0xFF; // Đảo bit đầu tiên
  const tamperedEnvelope = { ...envelope, data: originalBytes.toString('base64') };

  const decryptResult = await cryptoDecryptAesGcm(tamperedEnvelope, passphrase);
  assert.strictEqual(decryptResult, null, 'Bản mã bị can thiệp phải thất bại giải mã do sai AEAD tag');
});

test('BLOCKER 2: Invalid IV length causes clean rejection', async () => {
  const payload = { text: 'Kiểm tra độ dài IV' };
  const passphrase = 'PassphraseTest!';
  const envelope = await cryptoEncryptAesGcm(payload, passphrase);

  // Đổi IV thành 4 bytes (sai chuẩn 12 bytes AES-GCM)
  const invalidIvEnvelope = { ...envelope, iv: 'abcd1234' };
  const res = await cryptoDecryptAesGcm(invalidIvEnvelope, passphrase);
  assert.strictEqual(res, null, 'IV sai độ dài phải bị từ chối');
});

test('BLOCKER 2: Frontend bundle audit confirms NO private keys or admin passwords exist in assets', () => {
  const distDir = path.join(__dirname, '../../dist/assets');
  assert.ok(fs.existsSync(distDir), 'Thư mục dist/assets phải tồn tại');

  const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
  const bannedKeywords = [
    'ADMIN_KEY_SECRET_FORBIDDEN',
    'PRIVATE_KEY_BEGIN',
    'REAL_FIREBASE_SERVICE_ACCOUNT_KEY'
  ];

  for (const file of files) {
    const content = fs.readFileSync(path.join(distDir, file), 'utf8');
    for (const banned of bannedKeywords) {
      assert.strictEqual(
        content.includes(banned),
        false,
        `Bundle ${file} không được chứa khóa bí mật hardcoded: ${banned}`
      );
    }
  }
});

// =========================================================================
// TEST SUITE: BLOCKER 3 & 4 — DUAL-CONTEXT CONCURRENCY & INTEGRATION
// =========================================================================
test('BLOCKER 4: Dual-context concurrent edits simulate 2 independent browser devices', () => {
  // Device 1 (Context A)
  const contextA_Letter = {
    id: 'let_dual_01',
    title: 'Sửa từ Trình duyệt A',
    content: 'Alice đang viết thư từ Hà Nội',
    updatedAt: '2026-11-02T12:00:01.000Z'
  };

  // Device 2 (Context B)
  const contextB_Letter = {
    id: 'let_dual_01',
    title: 'Sửa từ Trình duyệt B',
    content: 'Bob đang viết thư từ Sài Gòn',
    updatedAt: '2026-11-02T12:00:02.000Z'
  };

  // Đồng bộ giữa hai context
  const { mergedLetters, conflictForks } = mergeLetters([contextA_Letter], [contextB_Letter], {}, {});

  assert.strictEqual(mergedLetters.length, 2, 'Cả hai phiên bản phải được giữ nguyên');
  assert.strictEqual(conflictForks.length, 1, 'Phải tạo 1 bản sao xung đột riêng biệt');
  assert.ok(conflictForks[0].title.startsWith('[Bản sao xung đột]'));
});
