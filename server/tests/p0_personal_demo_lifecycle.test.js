import test from 'node:test';
import assert from 'node:assert/strict';
import {
  syncWithCloudDb,
  pushToCloudDb,
  CLOUD_SYNC_ENABLED
} from '../../client/src/api/mockAdapter.js';
import {
  cryptoEncryptAesGcm,
  cryptoDecryptAesGcm
} from '../../client/src/api/syncEngine.js';
import authRouter from '../routes/auth.js';

test('PERSONAL DEMO: Letter Lifecycle, Reload Persistence & Zero Firebase Calls', async (t) => {
  // Mock localStorage
  const storage = new Map();
  const mockLocalStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  };

  // Mock global storage & network monitor
  const originalLocalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;
  let cloudCallCount = 0;
  const recordedUrls = [];

  globalThis.localStorage = mockLocalStorage;
  globalThis.fetch = async (url, options = {}) => {
    const urlStr = typeof url === 'string' ? url : url?.url || '';
    recordedUrls.push(urlStr);
    if (urlStr.includes('firebaseio.com') || urlStr.includes('googleapis.com')) {
      cloudCallCount++;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({})
    };
  };

  t.after(() => {
    globalThis.localStorage = originalLocalStorage;
    globalThis.fetch = originalFetch;
  });

  // 1. Xác minh cờ CLOUD_SYNC_ENABLED = false trong Personal Demo
  await t.test('1. Cloud Sync must be completely disabled in Personal Demo', () => {
    assert.strictEqual(CLOUD_SYNC_ENABLED, false, 'CLOUD_SYNC_ENABLED must be false');
  });

  // 2. Tạo thư mới và lưu vào LocalStorage
  const demoLetter = {
    id: 'let_demo_test_888',
    slug: 'let-demo-test-888',
    senderId: 'usr_tiendat_demo',
    senderUsername: 'tiendat',
    recipientName: 'Bạn Thân',
    recipientUsername: 'banthan',
    title: 'Kỷ niệm mùa xuân',
    theme: 'tet',
    hasPassword: true,
    password: 'DemoLetterPass@2026',
    passwordHint: 'Mật khẩu demo',
    content: {
      greeting: 'Chào bạn,',
      paragraphs: ['Chúc bạn một năm mới an khang thịnh vượng.', 'Mọi điều như ý!'],
      quotes: []
    },
    secretUnsaid: { enabled: true, content: 'Bí mật nhỏ trong thư.' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await t.test('2. Compose and Save Letter into LocalStorage', async () => {
    // Mã hóa nội dung thư bằng mật khẩu riêng
    const encryptedPayload = await cryptoEncryptAesGcm(demoLetter, demoLetter.password);
    assert.ok(encryptedPayload && encryptedPayload.v === 3);

    // Lưu vào LocalStorage dạng JSON
    const letters = [demoLetter];
    mockLocalStorage.setItem('gh_mock_letters', JSON.stringify(letters));

    const storedRaw = mockLocalStorage.getItem('gh_mock_letters');
    assert.ok(storedRaw, 'Letters must exist in localStorage');
    const parsed = JSON.parse(storedRaw);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].title, 'Kỷ niệm mùa xuân');
  });

  // 3. Thử gọi syncWithCloudDb và pushToCloudDb -> PHẢI BỊ CHẶN VÀ KHÔNG GỌI NETWORK
  await t.test('3. syncWithCloudDb and pushToCloudDb must not call remote Firebase cloud', async () => {
    // Đặt sẵn URL cloud cũ trong localStorage
    mockLocalStorage.setItem('gh_cloud_db_url', 'https://stale-secretletter-default-rtdb.firebaseio.com');

    const syncRes = await syncWithCloudDb();
    assert.strictEqual(syncRes.success, false);
    assert.strictEqual(syncRes.disabled, true);

    const pushRes = await pushToCloudDb();
    assert.strictEqual(pushRes.success, false);
    assert.strictEqual(pushRes.disabled, true);

    // Không được có cuộc gọi mạng nào ra Firebase
    assert.strictEqual(cloudCallCount, 0, 'Zero requests must be sent to Firebase');
  });

  // 4. Mô phỏng reload: Đọc lại thư từ storage và giải mã
  await t.test('4. Reload simulation: Read letter back from storage with 100% fidelity', async () => {
    const rawLetters = mockLocalStorage.getItem('gh_mock_letters');
    assert.ok(rawLetters);

    const letters = JSON.parse(rawLetters);
    const retrieved = letters.find(l => l.id === 'let_demo_test_888');
    assert.ok(retrieved, 'Must find letter after reload');
    assert.strictEqual(retrieved.recipientName, 'Bạn Thân');
    assert.strictEqual(retrieved.content.paragraphs.length, 2);
    assert.strictEqual(retrieved.secretUnsaid.content, 'Bí mật nhỏ trong thư.');

    // Mở khóa bằng mật mã
    const encrypted = await cryptoEncryptAesGcm(retrieved, retrieved.password);
    const decrypted = await cryptoDecryptAesGcm(encrypted, 'DemoLetterPass@2026');
    assert.ok(decrypted);
    assert.strictEqual(decrypted.title, retrieved.title);
  });

  // 5. Xác minh endpoint /api/auth/me đã bị vô hiệu hóa (HTTP 403)
  await t.test('5. Endpoint /api/auth/me must return HTTP 403 Forbidden', async () => {
    const meRoute = authRouter.stack.find(
      (layer) => layer.route && layer.route.path === '/me' && layer.route.methods.get
    );
    assert.ok(meRoute, 'Route /me must exist');

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

    const handler = meRoute.route.stack[0].handle;
    await handler(req, res);

    assert.strictEqual(responseStatus, 403, 'Must return HTTP 403 Forbidden');
    assert.strictEqual(responseBody.success, false);
    assert.match(responseBody.message, /vô hiệu hóa/i);
  });
});
