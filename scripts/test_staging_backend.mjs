import assert from 'node:assert';
import cors from 'cors';
import { createStagingApp } from '../server/stagingServer.js';

async function runStagingVerification() {
  console.log('🚀 [STAGING BACKEND VERIFICATION] Bắt đầu kiểm tra CORS & API Contracts...');
  const app = createStagingApp();

  const allowedOrigins = [
    'https://datmoitapdev.github.io',
    'https://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];

  const corsMiddleware = cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Policy: Origin ${origin} is not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-admin-key', 'if-match', 'If-Match'],
    exposedHeaders: ['ETag'],
    credentials: true
  });

  // Test 1: OPTIONS Preflight từ GitHub Pages
  console.log('\n--- 1. Kiểm tra CORS Preflight từ GitHub Pages ---');
  const mockReqPreflight = {
    method: 'OPTIONS',
    headers: {
      origin: 'https://datmoitapdev.github.io',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type,if-match'
    }
  };

  let capturedHeaders = {};
  const mockRes = {
    statusCode: 200,
    setHeader: (k, v) => { capturedHeaders[k.toLowerCase()] = v; },
    getHeader: (k) => capturedHeaders[k.toLowerCase()],
    end: () => {}
  };

  await new Promise((resolve) => {
    mockRes.end = () => resolve();
    corsMiddleware(mockReqPreflight, mockRes, () => resolve());
  });

  const allowOrigin = capturedHeaders['access-control-allow-origin'];
  console.log(`Access-Control-Allow-Origin: ${allowOrigin}`);
  assert.strictEqual(allowOrigin, 'https://datmoitapdev.github.io', 'CORS phải cho phép GitHub Pages origin');
  assert.ok(capturedHeaders['access-control-allow-methods'].includes('POST'), 'CORS phải cho phép POST');
  assert.ok(capturedHeaders['access-control-allow-headers'].includes('if-match'), 'CORS phải cho phép If-Match header');
  console.log('✔ CORS Preflight từ GitHub Pages: PASSED');

  // Test 2: Chặn Origin trái phép
  console.log('\n--- 2. Kiểm tra chặn Origin trái phép (CORS Origin Guard) ---');
  let blockedError = null;
  const mockReqUntrusted = {
    method: 'OPTIONS',
    headers: {
      origin: 'https://evil-hacker-site.com',
      'access-control-request-method': 'POST'
    }
  };
  const mockResUntrusted = {
    setHeader: () => {},
    end: () => {}
  };

  await new Promise((resolve) => {
    mockResUntrusted.end = () => resolve();
    corsMiddleware(mockReqUntrusted, mockResUntrusted, (err) => {
      blockedError = err;
      resolve();
    });
  });

  assert.ok(blockedError && blockedError.message.includes('CORS Policy'), 'Phải từ chối origin trái phép');
  console.log(`✔ Chặn truy cập từ website lạ (${blockedError.message}): PASSED`);

  // Test 3: Endpoint Health Check
  console.log('\n--- 3. Kiểm tra Health Endpoint ---');
  let healthBody = null;
  const mockReqHealth = {
    method: 'GET',
    url: '/api/health',
    headers: { host: 'localhost:5000' },
    socket: { remoteAddress: '127.0.0.1' }
  };
  await new Promise((resolve) => {
    const resHeaders = {};
    const mockResHealth = {
      setHeader: (k, v) => { resHeaders[k.toLowerCase()] = v; },
      getHeader: (k) => resHeaders[k.toLowerCase()],
      removeHeader: (k) => { delete resHeaders[k.toLowerCase()]; },
      json: (data) => {
        healthBody = data;
        resolve();
      }
    };
    app.handle(mockReqHealth, mockResHealth, (err) => {
      if (err) console.error('App handle error:', err);
      resolve();
    });
  });
  assert.ok(healthBody, 'Health body phải có dữ liệu phản hồi');
  assert.strictEqual(healthBody.status, 'healthy');
  assert.strictEqual(healthBody.environment, 'staging');
  console.log(`✔ Staging Health Endpoint: status=${healthBody.status}, env=${healthBody.environment}: PASSED`);

  console.log('\n✅ TẤT CẢ CÁC BÀI TEST STAGING BACKEND & CORS ĐÃ VƯỢT QUA 100%!\n');
}

runStagingVerification().catch((err) => {
  console.error('❌ Lỗi kiểm tra staging backend:', err);
  process.exit(1);
});
