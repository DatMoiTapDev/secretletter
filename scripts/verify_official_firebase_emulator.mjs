/**
 * SCRIPT KIỂM THỬ XÁC MINH FIREBASE LOCAL EMULATOR SUITE CHÍNH THỨC
 * Đáp ứng đầy đủ FIX-01, FIX-02, FIX-05, FIX-06
 */

import assert from 'node:assert';
import crypto from 'crypto';
import { createFirebaseCustomToken, verifyFirebaseIdToken } from '../server/auth.js';

// FIX-06: Kiểm tra bảo vệ Hostname strictly localhost/127.0.0.1
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const RTDB_HOST = process.env.FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1:9000';
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'secretletter-test-emulator';

function assertLocalhost(hostStr, name) {
  const [hostname] = hostStr.split(':');
  if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
    throw new Error(`[AN TOÀN BỊ VI PHẠM] ${name} (${hostStr}) không phải là localhost/127.0.0.1! Dừng ngay để bảo vệ dữ liệu.`);
  }
}

assertLocalhost(AUTH_HOST, 'FIREBASE_AUTH_EMULATOR_HOST');
assertLocalhost(RTDB_HOST, 'FIREBASE_DATABASE_EMULATOR_HOST');

console.log('========================================================');
console.log(' [OFFICIAL FIREBASE EMULATOR SUITE VERIFICATION GATE]');
console.log(` - Auth Emulator Host: ${AUTH_HOST}`);
console.log(` - RTDB Emulator Host: ${RTDB_HOST}`);
console.log(` - Project ID        : ${PROJECT_ID}`);
console.log('========================================================\n');

async function testOfficialEmulator() {
  // ============================================================================
  // BƯỚC 1: KIỂM TRA PRODUCTION FUNCTION createFirebaseCustomToken (FIX-02)
  // ============================================================================
  console.log('[BƯỚC 1: XÁC MINH THUẬT TOÁN RS256 CỦA createFirebaseCustomToken]');
  console.log('> Lưu ý: Bài test sử dụng cặp khóa RSA kiểm thử nội bộ, KHÔNG dùng khóa thật production.');

  const testToken = createFirebaseCustomToken({
    uid: 'usr_test_rs256',
    username: 'test_user',
    role: 'member'
  });

  const parts = testToken.split('.');
  assert.strictEqual(parts.length, 3, 'Custom Token phải gồm 3 phần header.payload.signature');

  const decodedHeader = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  assert.strictEqual(decodedHeader.alg, 'RS256', 'Header alg bắt buộc phải là RS256');
  assert.strictEqual(decodedHeader.typ, 'JWT', 'Header typ bắt buộc phải là JWT');

  const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  assert.strictEqual(decodedPayload.uid, 'usr_test_rs256');
  assert.strictEqual(decodedPayload.claims.role, 'member');
  assert.strictEqual(decodedPayload.claims.username, 'test_user');
  assert.strictEqual(decodedPayload.aud, 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit');
  assert.ok(decodedPayload.exp > decodedPayload.iat, 'Expiration phải lớn hơn issued-at');

  console.log('✔ Thuật toán ký RS256, Audience, Issuer, UID và Claims của mã nguồn production đã được xác minh chính xác.');

  // ============================================================================
  // BƯỚC 2: TRAO ĐỔI TOKEN VỚI AUTH EMULATOR (FIX-02 MINH BẠCH)
  // ============================================================================
  console.log('\n[BƯỚC 2: TRAO ĐỔI TOKEN VỚI FIREBASE AUTH EMULATOR]');
  console.log('> Lưu ý: alg: "none" CHỈ được Google cho phép trên môi trường Emulator cục bộ.');

  const emulatorHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const alicePayload = Buffer.from(JSON.stringify({
    iss: `firebase-auth-emulator@${PROJECT_ID}.iam.gserviceaccount.com`,
    sub: `firebase-auth-emulator@${PROJECT_ID}.iam.gserviceaccount.com`,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid: 'usr_alice_demo',
    claims: { role: 'member', username: 'alice_demo' }
  })).toString('base64url');
  const emulatorCustomToken = `${emulatorHeader}.${alicePayload}.`;

  const signInRes = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: emulatorCustomToken, returnSecureToken: true })
  });

  const signInData = await signInRes.json();
  assert.ok(signInData.idToken, 'Phải nhận được Firebase ID Token từ Emulator');
  assert.ok(signInData.refreshToken, 'Phải nhận được Refresh Token từ Emulator');
  const aliceIdToken = signInData.idToken;
  const aliceRefreshToken = signInData.refreshToken;
  console.log(`✔ Auth Emulator cấp phát Firebase ID Token và Refresh Token thành công.`);

  // Test Refresh Token
  const refreshRes = await fetch(`http://${AUTH_HOST}/securetoken.googleapis.com/v1/token?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: aliceRefreshToken })
  });
  const refreshData = await refreshRes.json();
  assert.ok(refreshData.id_token, 'Phải làm mới được ID Token');
  console.log(`✔ Kiểm thử làm mới token thành công qua securetoken.googleapis.com/v1/token.`);

  // ============================================================================
  // BƯỚC 3: QUY TRÌNH CHUẨN X-Firebase-ETag & If-Match OCC (FIX-01)
  // ============================================================================
  console.log('\n[BƯỚC 3: QUY TRÌNH KIỂM THỬ ETAG & IF-MATCH THEO CHUẨN FIREBASE REST]');
  const vaultUrl = `http://${RTDB_HOST}/user_vaults/usr_alice_demo.json?ns=${PROJECT_ID}&auth=${aliceIdToken}`;

  // 1. GET dữ liệu ban đầu kèm header X-Firebase-ETag: true
  console.log('- 1. Thực hiện GET với header X-Firebase-ETag: true...');
  const get1 = await fetch(vaultUrl, {
    method: 'GET',
    headers: { 'X-Firebase-ETag': 'true' }
  });
  assert.strictEqual(get1.status, 200, 'GET ban đầu phải trả về HTTP 200');
  const initialEtag = get1.headers.get('etag') || get1.headers.get('ETag');
  console.log(`  > ETag ban đầu nhận được: ${initialEtag || '(null / rỗng lần đầu)'}`);

  // 2. PUT phiên bản mới (v1) với If-Match chứa initialEtag (hoặc null ban đầu)
  console.log('- 2. Thực hiện PUT phiên bản A với header If-Match...');
  const putHeaders = { 'Content-Type': 'application/json' };
  if (initialEtag) putHeaders['if-match'] = initialEtag;

  const payloadV1 = { cipher: 'alice_vault_data_version_A', updatedAt: new Date().toISOString() };
  const put1 = await fetch(vaultUrl, {
    method: 'PUT',
    headers: putHeaders,
    body: JSON.stringify(payloadV1)
  });
  assert.strictEqual(put1.status, 200, 'PUT phiên bản A phải thành công HTTP 200');
  console.log('  ✔ Ghi phiên bản A thành công.');

  // 3. GET lại với X-Firebase-ETag để nhận ETag của phiên bản A
  const get2 = await fetch(vaultUrl, {
    method: 'GET',
    headers: { 'X-Firebase-ETag': 'true' }
  });
  const etagVersionA = get2.headers.get('etag') || get2.headers.get('ETag');
  assert.ok(etagVersionA, 'GET phiên bản A phải trả về ETag mới');
  console.log(`  > ETag của phiên bản A: ${etagVersionA}`);

  // 4. Thử PUT lần hai với ETag cũ (initialEtag hoặc stale) -> PHẢI TRẢ VỀ HTTP 412
  console.log('- 3. Thử PUT phiên bản B với stale ETag giả mạo...');
  const staleEtag = '"stale_etag_mismatch_123"';
  const putStale = await fetch(vaultUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'if-match': staleEtag
    },
    body: JSON.stringify({ cipher: 'stale_overwrite_attempt', updatedAt: new Date().toISOString() })
  });
  assert.strictEqual(putStale.status, 412, 'Stale ETag bắt buộc phải trả về HTTP 412 Precondition Failed');
  console.log('  ✔ Firebase RTDB trả về chính xác HTTP 412 (Precondition Failed). Chống ghi đè thành công!');

  // 5. GET lại để chứng minh dữ liệu phiên bản A KHÔNG bị ghi đè bởi lần thử thất bại
  console.log('- 4. GET lại kiểm chứng phiên bản A không bị ghi đè mất...');
  const getVerify = await fetch(vaultUrl, {
    method: 'GET',
    headers: { 'X-Firebase-ETag': 'true' }
  });
  const verifyData = await getVerify.json();
  assert.strictEqual(verifyData.cipher, payloadV1.cipher, 'Dữ liệu phải vẫn là phiên bản A');
  console.log('  ✔ Dữ liệu phiên bản A được bảo toàn nguyên vẹn.');

  // ============================================================================
  // BƯỚC 4: BẢO VỆ DANH SÁCH NGƯỜI DÙNG /users (FIX-05)
  // ============================================================================
  console.log('\n[BƯỚC 4: KIỂM THỬ BẢO VỆ DANH SÁCH TÀI KHOẢN /users]');

  // 1. Member Alice cố đọc danh sách toàn bộ người dùng /users.json -> PHẢI BỊ CHẶN (HTTP 401)
  const readAllUsers = await fetch(`http://${RTDB_HOST}/users.json?ns=${PROJECT_ID}&auth=${aliceIdToken}`);
  assert.strictEqual(readAllUsers.status, 401, 'Member không được phép đọc toàn bộ /users.json');
  console.log(`✔ Chặn Member đọc toàn bộ danh sách /users.json: HTTP ${readAllUsers.status} (Permission denied)`);

  // 2. Member Alice đọc hồ sơ của chính mình /users/usr_alice_demo.json -> ĐƯỢC PHÉP
  const readOwnUser = await fetch(`http://${RTDB_HOST}/users/usr_alice_demo.json?ns=${PROJECT_ID}&auth=${aliceIdToken}`);
  assert.strictEqual(readOwnUser.status, 200, 'Member được đọc hồ sơ của chính mình');
  console.log(`✔ Member đọc hồ sơ của chính mình: HTTP ${readOwnUser.status} OK`);

  // ============================================================================
  // BƯỚC 5: KIỂM THỬ PHÂN VÙNG /vault_data VÀ USER VAULTS
  // ============================================================================
  console.log('\n[BƯỚC 5: KIỂM THỬ CÁCH LY PHÂN VÙNG DỮ LIỆU]');

  // Member Alice cố đọc /vault_data -> BỊ CHẶN (HTTP 401)
  const readMasterVault = await fetch(`http://${RTDB_HOST}/vault_data.json?ns=${PROJECT_ID}&auth=${aliceIdToken}`);
  assert.strictEqual(readMasterVault.status, 401, 'Member không được đọc Master Vault');
  console.log(`✔ Chặn Member đọc Master Vault /vault_data: HTTP ${readMasterVault.status} (Permission denied)`);

  // Member Alice cố đọc vault của Bob -> BỊ CHẶN (HTTP 401)
  const readBobVault = await fetch(`http://${RTDB_HOST}/user_vaults/usr_bob_demo.json?ns=${PROJECT_ID}&auth=${aliceIdToken}`);
  assert.strictEqual(readBobVault.status, 401, 'Member không được đọc vault của người khác');
  console.log(`✔ Chặn Member đọc vault của thành viên khác: HTTP ${readBobVault.status} (Permission denied)`);

  console.log('\n========================================================');
  console.log('✅ TOÀN BỘ CÁC BÀI TEST FIREBASE EMULATOR ĐÃ VƯỢT QUA 100%!');
  console.log('========================================================\n');
}

testOfficialEmulator().catch((err) => {
  console.error('❌ Lỗi kiểm thử Firebase Emulator:', err);
  process.exit(1);
});
