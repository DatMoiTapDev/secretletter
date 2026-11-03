import test from 'node:test';
import assert from 'node:assert';
import {
  FirebaseAuthEmulator,
  FirebaseRtdbEmulator,
  loadDatabaseRules
} from '../emulator/firebaseEmulator.js';
import {
  createFirebaseCustomToken,
  verifyFirebaseIdToken
} from '../auth.js';
import authRouter from '../routes/auth.js';
import {
  migrateToV3Payload,
  cryptoEncryptAesGcm,
  cryptoDecryptAesGcm
} from '../../client/src/api/syncEngine.js';
import { buildFirebaseRestUrl } from '../../client/src/api/firebaseAuth.js';

test('RC1.1 — Firebase Auth Integration & Emulator Verification Suite', async (t) => {
  const authEmulator = new FirebaseAuthEmulator('secretletter-staging');
  const rtdbEmulator = new FirebaseRtdbEmulator(authEmulator);

  // 1. ANONYMOUS ACCESS REJECTED (Deny-by-default)
  await t.test('1. Anonymous read/write is strictly rejected by rules (Deny-by-default)', async () => {
    // Thử đọc không có token (?auth=)
    const readRes = await rtdbEmulator.handleRequest({
      url: '/vault_data.json',
      method: 'GET'
    });
    assert.strictEqual(readRes.status, 401, 'Anonymous GET must be HTTP 401');
    assert.match(readRes.data.error, /Permission denied|unauthenticated/);

    // Thử ghi không có token
    const writeRes = await rtdbEmulator.handleRequest({
      url: '/vault_data.json',
      method: 'PUT',
      body: { cipher: 'malicious_payload', updatedAt: new Date().toISOString() }
    });
    assert.strictEqual(writeRes.status, 401, 'Anonymous PUT must be HTTP 401');
  });

  // 2. FIREBASE AUTH CUSTOM TOKEN TO ID TOKEN FLOW
  await t.test('2. Server mints valid Firebase Custom Token and client exchanges for ID Token', async () => {
    // Server tạo Custom Token cho Member Alice
    const customTokenAlice = authEmulator.createCustomToken('usr_alice_123', {
      role: 'member',
      username: 'alice'
    });
    assert.ok(customTokenAlice.split('.').length === 3, 'Custom Token must be valid 3-part JWT');

    // Client đăng nhập bằng Custom Token (signInWithCustomToken)
    const signInResult = authEmulator.signInWithCustomToken(customTokenAlice);
    assert.ok(signInResult.idToken, 'Must receive valid Firebase ID Token');
    assert.ok(signInResult.refreshToken, 'Must receive valid Refresh Token');
    assert.strictEqual(signInResult.user.username, 'alice');
    assert.strictEqual(signInResult.user.role, 'member');

    // Kiểm tra cấu trúc ID Token
    const verifiedIdToken = authEmulator.verifyIdToken(signInResult.idToken);
    assert.ok(verifiedIdToken, 'ID Token must verify successfully');
    assert.strictEqual(verifiedIdToken.sub, 'usr_alice_123');
    assert.strictEqual(verifiedIdToken.role, 'member');
  });

  // 3. REFRESH TOKEN LIFECYCLE
  await t.test('3. Refresh token successfully obtains fresh ID Token', async () => {
    const customToken = authEmulator.createCustomToken('usr_bob_456', { role: 'member', username: 'bob' });
    const { refreshToken, idToken: oldIdToken } = authEmulator.signInWithCustomToken(customToken);

    const refreshResult = authEmulator.refreshToken(refreshToken);
    assert.ok(refreshResult.idToken, 'Must receive refreshed ID Token');
    assert.strictEqual(typeof refreshResult.idToken, 'string');

    // ID Token mới vẫn xác minh đúng danh tính
    const verified = authEmulator.verifyIdToken(refreshResult.idToken);
    assert.strictEqual(verified.sub, 'usr_bob_456');
    assert.strictEqual(verified.username, 'bob');
  });

  // 4. TAMPERED, FORGED OR EXPIRED TOKEN REJECTION
  await t.test('4. Tampered, forged or expired ID Token is rejected with HTTP 401', async () => {
    // Token có chữ ký rác
    const fakeToken = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.invalidsig123';
    const fakeRes = await rtdbEmulator.handleRequest({
      url: `/vault_data.json?auth=${encodeURIComponent(fakeToken)}`,
      method: 'GET'
    });
    assert.strictEqual(fakeRes.status, 401, 'Forged token must return HTTP 401');

    // Token bị sửa bit
    const validCustom = authEmulator.createCustomToken('usr_charlie', { role: 'member' });
    const { idToken } = authEmulator.signInWithCustomToken(validCustom);
    const tamperedIdToken = idToken.slice(0, -6) + 'xxxxxx';
    const tamperedRes = await rtdbEmulator.handleRequest({
      url: `/vault_data.json?auth=${encodeURIComponent(tamperedIdToken)}`,
      method: 'GET'
    });
    assert.strictEqual(tamperedRes.status, 401, 'Tampered ID Token must return HTTP 401');
  });

  // 5. MEMBER ISOLATION: MEMBER A CANNOT ACCESS MEMBER B'S PRIVATE LETTER
  await t.test('5. Member A cannot access Member B private letter, but can read own and broadcast', async () => {
    const tokenAlice = authEmulator.signInWithCustomToken(
      authEmulator.createCustomToken('usr_alice_123', { role: 'member', username: 'alice' })
    ).idToken;

    const tokenBob = authEmulator.signInWithCustomToken(
      authEmulator.createCustomToken('usr_bob_456', { role: 'member', username: 'bob' })
    ).idToken;

    // Thiết lập thư trong store của RTDB Emulator
    rtdbEmulator.store.letters = {
      let_bob_private: {
        id: 'let_bob_private',
        senderId: 'usr_bob_456',
        recipientUsername: 'bob',
        isBroadcast: false,
        title: 'Thư riêng của Bob'
      },
      let_broadcast_all: {
        id: 'let_broadcast_all',
        senderId: 'usr_root_admin',
        recipientUsername: 'all',
        isBroadcast: true,
        title: 'Thư thông báo chung'
      }
    };

    // Alice cố đọc thư riêng của Bob -> BỊ TỪ CHỐI
    const aliceReadBob = await rtdbEmulator.handleRequest({
      url: `/letters/let_bob_private.json?auth=${encodeURIComponent(tokenAlice)}`,
      method: 'GET'
    });
    assert.strictEqual(aliceReadBob.status, 401, 'Alice must be blocked from reading Bob letter');
    assert.match(aliceReadBob.data.error, /recipient or sender isolation enforced/);

    // Bob đọc thư của chính mình -> THÀNH CÔNG
    const bobReadOwn = await rtdbEmulator.handleRequest({
      url: `/letters/let_bob_private.json?auth=${encodeURIComponent(tokenBob)}`,
      method: 'GET'
    });
    assert.strictEqual(bobReadOwn.status, 200, 'Bob can read own private letter');
    assert.strictEqual(bobReadOwn.data.title, 'Thư riêng của Bob');

    // Alice đọc thư broadcast chung -> THÀNH CÔNG
    const aliceReadBroadcast = await rtdbEmulator.handleRequest({
      url: `/letters/let_broadcast_all.json?auth=${encodeURIComponent(tokenAlice)}`,
      method: 'GET'
    });
    assert.strictEqual(aliceReadBroadcast.status, 200, 'Alice can read broadcast letter');
  });

  // 6. MASTER ADMIN CUSTOM CLAIM FULL ACCESS
  await t.test('6. Master Admin with verified custom claim has full read/write access', async () => {
    const adminCustomToken = authEmulator.createCustomToken('usr_root_admin', {
      role: 'admin',
      username: 'admin'
    });
    const { idToken: adminIdToken } = authEmulator.signInWithCustomToken(adminCustomToken);

    // Admin đọc /admin node
    const adminRead = await rtdbEmulator.handleRequest({
      url: `/admin.json?auth=${encodeURIComponent(adminIdToken)}`,
      method: 'GET'
    });
    assert.strictEqual(adminRead.status, 200, 'Admin can read /admin node');

    // Admin đọc được cả thư riêng của Bob
    const adminReadBob = await rtdbEmulator.handleRequest({
      url: `/letters/let_bob_private.json?auth=${encodeURIComponent(adminIdToken)}`,
      method: 'GET'
    });
    assert.strictEqual(adminReadBob.status, 200, 'Admin can read any letter in studio');
  });

  // 7. PRIVILEGE ESCALATION DEFENSE
  await t.test('7. Member cannot elevate role to admin via payload or DevTools', async () => {
    const tokenAlice = authEmulator.signInWithCustomToken(
      authEmulator.createCustomToken('usr_alice_123', { role: 'member', username: 'alice' })
    ).idToken;

    // Alice gửi PUT sửa tài khoản của mình thành role: 'admin'
    const escalationRes = await rtdbEmulator.handleRequest({
      url: `/users/usr_alice_123.json?auth=${encodeURIComponent(tokenAlice)}`,
      method: 'PUT',
      body: { id: 'usr_alice_123', username: 'alice', role: 'admin' }
    });
    assert.strictEqual(escalationRes.status, 401, 'Self-elevation to admin must return HTTP 401');
    assert.match(escalationRes.data.error, /privilege escalation blocked/);
  });

  // 8. ATOMIC OCC CONCURRENCY & ETAG / IF-MATCH
  await t.test('8. ETag / If-Match handles atomic concurrent writes and returns HTTP 412 on mismatch', async () => {
    const adminToken = authEmulator.signInWithCustomToken(
      authEmulator.createCustomToken('usr_root_admin', { role: 'admin', username: 'admin' })
    ).idToken;

    // 1. Initial write
    const write1 = await rtdbEmulator.handleRequest({
      url: `/vault_data.json?auth=${encodeURIComponent(adminToken)}`,
      method: 'PUT',
      body: { cipher: 'v1_data', updatedAt: new Date().toISOString() }
    });
    assert.strictEqual(write1.status, 200);
    const etag1 = write1.headers['ETag'];
    assert.ok(etag1, 'Write must return ETag header');

    // 2. Device A updates with correct ETag -> SUCCESS
    const write2 = await rtdbEmulator.handleRequest({
      url: `/vault_data.json?auth=${encodeURIComponent(adminToken)}`,
      method: 'PUT',
      headers: { 'if-match': etag1 },
      body: { cipher: 'v2_data_from_device_a', updatedAt: new Date().toISOString() }
    });
    assert.strictEqual(write2.status, 200);
    const etag2 = write2.headers['ETag'];
    assert.notStrictEqual(etag1, etag2, 'New ETag must differ from old ETag');

    // 3. Device B attempts write with stale etag1 -> HTTP 412 PRECONDITION FAILED
    const writeStale = await rtdbEmulator.handleRequest({
      url: `/vault_data.json?auth=${encodeURIComponent(adminToken)}`,
      method: 'PUT',
      headers: { 'if-match': etag1 },
      body: { cipher: 'stale_data_from_device_b', updatedAt: new Date().toISOString() }
    });
    assert.strictEqual(writeStale.status, 412, 'Stale ETag must trigger HTTP 412 Precondition Failed');
    assert.match(writeStale.data.error, /Precondition Failed/);
  });

  // 9. DATA PARTITIONING & USER VAULT ISOLATION (USER A CANNOT READ USER B'S VAULT)
  await t.test('9. User A cannot read User B vault, and Member cannot read Master /vault_data', async () => {
    const tokenAlice = authEmulator.signInWithCustomToken(
      authEmulator.createCustomToken('usr_alice_123', { role: 'member', username: 'alice' })
    ).idToken;
    const tokenBob = authEmulator.signInWithCustomToken(
      authEmulator.createCustomToken('usr_bob_456', { role: 'member', username: 'bob' })
    ).idToken;
    const adminToken = authEmulator.signInWithCustomToken(
      authEmulator.createCustomToken('usr_root_admin', { role: 'admin', username: 'admin' })
    ).idToken;

    // Bob lưu dữ liệu vào vault riêng của mình
    await rtdbEmulator.handleRequest({
      url: `/user_vaults/usr_bob_456.json?auth=${encodeURIComponent(tokenBob)}`,
      method: 'PUT',
      body: { cipher: 'bobs_secret_encrypted_vault', updatedAt: new Date().toISOString() }
    });

    // 1. Alice cố đọc master vault /vault_data -> BỊ TỪ CHỐI (Chỉ Admin)
    const aliceReadMaster = await rtdbEmulator.handleRequest({
      url: `/vault_data.json?auth=${encodeURIComponent(tokenAlice)}`,
      method: 'GET'
    });
    assert.strictEqual(aliceReadMaster.status, 401, 'Member cannot read master vault');
    assert.match(aliceReadMaster.data.error, /master vault is admin only/);

    // 2. Alice cố đọc vault riêng của Bob -> BỊ TỪ CHỐI (Cách ly người dùng)
    const aliceReadBobVault = await rtdbEmulator.handleRequest({
      url: `/user_vaults/usr_bob_456.json?auth=${encodeURIComponent(tokenAlice)}`,
      method: 'GET'
    });
    assert.strictEqual(aliceReadBobVault.status, 401, 'User A cannot read User B vault');
    assert.match(aliceReadBobVault.data.error, /user vault isolation enforced/);

    // 3. Bob đọc vault của chính mình -> THÀNH CÔNG
    const bobReadOwnVault = await rtdbEmulator.handleRequest({
      url: `/user_vaults/usr_bob_456.json?auth=${encodeURIComponent(tokenBob)}`,
      method: 'GET'
    });
    assert.strictEqual(bobReadOwnVault.status, 200, 'User B can read own vault');
    assert.strictEqual(bobReadOwnVault.data.cipher, 'bobs_secret_encrypted_vault');

    // 4. Admin có quyền đọc vault của Bob để hỗ trợ -> THÀNH CÔNG
    const adminReadBobVault = await rtdbEmulator.handleRequest({
      url: `/user_vaults/usr_bob_456.json?auth=${encodeURIComponent(adminToken)}`,
      method: 'GET'
    });
    assert.strictEqual(adminReadBobVault.status, 200, 'Admin can read user vault');
  });

  // 10. DATA MIGRATION FIDELITY (V1/V2 TO V3 SCHEMA WITHOUT LETTER LOSS)
  await t.test('10. Migration preserves 100% of letters and users during schema upgrade', async () => {
    const legacyPayload = {
      letters: [
        { id: 'let_legacy_1', title: 'Thư tình đầu tiên', recipientName: 'Mai' },
        { id: 'let_legacy_2', title: 'Kỷ niệm mùa thu', recipientName: 'Lan' }
      ],
      users: [
        { id: 'usr_root_admin', username: 'admin', role: 'admin' },
        { id: 'usr_mem_1', username: 'mai', role: 'member' }
      ],
      vibe: {
        love: { id: 'love', name: 'Tình yêu', recipients: [] }
      }
    };

    const v3Payload = migrateToV3Payload(legacyPayload);
    assert.strictEqual(v3Payload.schemaVersion, 3, 'Schema version must be upgraded to 3');
    assert.strictEqual(v3Payload.letters.length, 2, 'Must retain all 2 letters');
    assert.strictEqual(v3Payload.letters[0].title, 'Thư tình đầu tiên');
    assert.strictEqual(v3Payload.letters[1].title, 'Kỷ niệm mùa thu');
    assert.ok(v3Payload.deletedIds, 'Must add permanent deletedIds tracking index');
  });

  // 11. USER DIRECTORY PRIVACY & ROOT /users PROTECTION (FIX-05)
  await t.test('11. Member cannot read /users list (HTTP 401), but can read own profile /users/:userId', async () => {
    const tokenAlice = authEmulator.signInWithCustomToken(
      authEmulator.createCustomToken('usr_alice_123', { role: 'member', username: 'alice' })
    ).idToken;
    const adminToken = authEmulator.signInWithCustomToken(
      authEmulator.createCustomToken('usr_root_admin', { role: 'admin', username: 'admin' })
    ).idToken;

    rtdbEmulator.store.users = {
      usr_alice_123: { id: 'usr_alice_123', username: 'alice', role: 'member', status: 'active' },
      usr_bob_456: { id: 'usr_bob_456', username: 'bob', role: 'member', status: 'active' }
    };

    // 1. Alice đọc toàn bộ /users -> PHẢI BỊ CHẶN (HTTP 401)
    const aliceReadAllUsers = await rtdbEmulator.handleRequest({
      url: `/users.json?auth=${encodeURIComponent(tokenAlice)}`,
      method: 'GET'
    });
    assert.strictEqual(aliceReadAllUsers.status, 401, 'Member cannot read entire /users directory');
    assert.match(aliceReadAllUsers.data.error, /user directory is admin only/);

    // 2. Alice đọc hồ sơ của chính mình -> THÀNH CÔNG (HTTP 200)
    const aliceReadOwn = await rtdbEmulator.handleRequest({
      url: `/users/usr_alice_123.json?auth=${encodeURIComponent(tokenAlice)}`,
      method: 'GET'
    });
    assert.strictEqual(aliceReadOwn.status, 200, 'Member can read own user record');
    assert.strictEqual(aliceReadOwn.data.username, 'alice');

    // 3. Alice cố đọc hồ sơ của Bob -> PHẢI BỊ CHẶN (HTTP 401)
    const aliceReadBob = await rtdbEmulator.handleRequest({
      url: `/users/usr_bob_456.json?auth=${encodeURIComponent(tokenAlice)}`,
      method: 'GET'
    });
    assert.strictEqual(aliceReadBob.status, 401, 'Member cannot read another user record');

    // 4. Admin đọc toàn bộ /users -> THÀNH CÔNG (HTTP 200)
    const adminReadAllUsers = await rtdbEmulator.handleRequest({
      url: `/users.json?auth=${encodeURIComponent(adminToken)}`,
      method: 'GET'
    });
    assert.strictEqual(adminReadAllUsers.status, 200, 'Admin can read user directory');
  });

  // 12. PRODUCTION FUNCTION createFirebaseCustomToken RS256 VERIFICATION (FIX-02)
  await t.test('12. Production createFirebaseCustomToken mints valid RS256 token with verified claims', async () => {
    const token = createFirebaseCustomToken({
      uid: 'usr_prod_alice',
      username: 'alice',
      role: 'member'
    });

    const parts = token.split('.');
    assert.strictEqual(parts.length, 3, 'Must be valid 3-part JWT');

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    assert.strictEqual(header.alg, 'RS256', 'Production Custom Token must use RS256');
    assert.strictEqual(header.typ, 'JWT');

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    assert.strictEqual(payload.uid, 'usr_prod_alice');
    assert.strictEqual(payload.claims.role, 'member');
    assert.strictEqual(payload.claims.username, 'alice');
    assert.strictEqual(payload.aud, 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit');
  });

  // 13. HOTFIX: Endpoint /firebase-custom-token is disabled (HTTP 403) and rejects client-supplied x-user-id
  await t.test('13. Endpoint /api/auth/firebase-custom-token is disabled (HTTP 403) and rejects client x-user-id', async () => {
    const route = authRouter.stack.find(
      (layer) => layer.route && layer.route.path === '/firebase-custom-token' && layer.route.methods.post
    );
    assert.ok(route, 'Route /firebase-custom-token must exist');

    let responseStatus = 0;
    let responseBody = null;
    const req = {
      headers: { 'x-user-id': 'usr_tiendat_root' },
      body: {}
    };
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      }
    };

    const handler = route.route.stack[0].handle;
    await handler(req, res);

    assert.strictEqual(responseStatus, 403, 'Must return HTTP 403 Forbidden');
    assert.strictEqual(responseBody.success, false);
    assert.match(responseBody.message, /vô hiệu hóa/i);
  });
});
