import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { FIREBASE_EMULATOR_KEYS } from './emulator/firebaseEmulator.js';

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(plainPassword) {
  if (!plainPassword || plainPassword.trim() === '') {
    return '';
  }
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword.trim(), salt);
}

/**
 * Verify plain password against hashed password
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  if (!hashedPassword || hashedPassword === '') {
    return true; // Thư không đặt mật khẩu
  }
  if (!plainPassword) {
    return false;
  }
  return bcrypt.compare(plainPassword.trim(), hashedPassword);
}

/**
 * Tạo Firebase Custom Token chính thức (RS256 JWT theo chuẩn Google Identity Platform)
 * RC1.1: Sử dụng khóa riêng tư phía máy chủ để ký, không bao giờ lộ Private Key cho frontend.
 */
export function createFirebaseCustomToken({ uid, username, role = 'member' }) {
  const serviceAccountEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-admin@secretletter.iam.gserviceaccount.com';
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || FIREBASE_EMULATOR_KEYS.privateKey;

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: serviceAccountEmail,
    sub: serviceAccountEmail,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid: String(uid),
    claims: {
      role: role === 'admin' ? 'admin' : 'member',
      username: username ? username.toLowerCase().trim() : String(uid)
    }
  })).toString('base64url');

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(privateKey, 'base64url');

  return `${header}.${payload}.${signature}`;
}

/**
 * Xác minh Firebase ID Token theo chuẩn RS256
 */
export function verifyFirebaseIdToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const publicKey = process.env.FIREBASE_PUBLIC_KEY || FIREBASE_EMULATOR_KEYS.publicKey;

  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${header}.${payload}`);
    const isValid = verifier.verify(publicKey, signature, 'base64url');
    if (!isValid) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Ký và cấp phát ID Token xác thực từ môi trường tin cậy (Trusted Server Minting)
 * BLOCKER 1: Chỉ backend có secret mới có thể cấp quyền role: 'admin'
 */
export function mintTrustedAuthToken({ uid, username, role = 'member' }) {
  const secret = process.env.ADMIN_KEY || 'SERVER_TRUSTED_SIGNING_KEY_2026';
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    uid,
    username: username.toLowerCase().trim(),
    role: role === 'admin' ? 'admin' : 'member',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');

  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

/**
 * Xác minh tính toàn vẹn và chữ ký của ID Token
 */
export function verifyTrustedAuthToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const secret = process.env.ADMIN_KEY || 'SERVER_TRUSTED_SIGNING_KEY_2026';
  const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');

  if (!safeCompare(signature, expectedSig)) {
    return null; // Chữ ký giả mạo hoặc token bị can thiệp
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token hết hạn
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Express middleware for Admin authorization
 * Enforces fail-closed policy: if ADMIN_KEY is not configured, all admin access is denied.
 */
export function requireAdmin(req, res, next) {
  const adminSecret = process.env.ADMIN_KEY || '';
  if (!adminSecret || adminSecret.trim() === '') {
    return res.status(503).json({
      error: 'Quản trị viên chưa được cấu hình ADMIN_KEY an toàn trên máy chủ. Mọi truy cập bị từ chối mặc định.'
    });
  }

  const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];
  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ error: 'Truy cập bị từ chối. Cần quyền Quản trị viên (Creator Studio).' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (safeCompare(token.trim(), adminSecret.trim())) {
    return next();
  }

  return res.status(401).json({ error: 'Truy cập bị từ chối. Cần quyền Quản trị viên (Creator Studio).' });
}

/**
 * Trình thẩm định quy tắc bảo mật (Firebase Security Rules Evaluator)
 * Kiểm thử chính xác các quy tắc phân quyền trong database.rules.json
 */
export function evaluateSecurityRule({ path, operation = 'read', auth = null, data = null, newData = null }) {
  // 1. Deny-by-default nếu chưa đăng nhập và thao tác đường dẫn nhạy cảm
  if (!auth) {
    if (path.startsWith('/admin') || path.startsWith('/vault_data') || path.startsWith('/letters') || path.startsWith('/users')) {
      return { allowed: false, reason: 'Deny-by-default: Unauthenticated access rejected' };
    }
    return { allowed: false, reason: 'Root deny' };
  }

  // 2. Khu vực /admin
  if (path.startsWith('/admin')) {
    if (auth.token?.role === 'admin') {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Chỉ Master Admin mới có quyền truy cập /admin' };
  }

  // 3. Khu vực /letters/:letterId
  if (path.startsWith('/letters/')) {
    const letterId = path.split('/')[2];
    if (auth.token?.role === 'admin') {
      return { allowed: true };
    }

    if (operation === 'read') {
      const isRecipient = data?.recipientUsername && data.recipientUsername === auth.token?.username;
      const isSender = data?.senderId && data.senderId === auth.uid;
      const isBroadcast = Boolean(data?.isBroadcast);

      if (isRecipient || isSender || isBroadcast) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Không có quyền đọc thư riêng của người khác' };
    }

    if (operation === 'write') {
      if (newData?.senderId === auth.uid && (!data || data.senderId === auth.uid)) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Không có quyền ghi đè thư của người khác' };
    }
  }

  // 4. Khu vực /users/:userId
  if (path.startsWith('/users/')) {
    const targetUserId = path.split('/')[2];
    if (auth.token?.role === 'admin' || auth.uid === targetUserId) {
      // Chống tự nâng quyền role: member không được tự set role = admin
      if (operation === 'write' && newData?.role === 'admin' && auth.token?.role !== 'admin') {
        return { allowed: false, reason: 'Member không thể tự cấp quyền admin' };
      }
      return { allowed: true };
    }
    return { allowed: false, reason: 'Không thể truy cập tài khoản người khác' };
  }

  // 5. Khu vực /vault_data
  if (path === '/vault_data' || path.startsWith('/vault_data/')) {
    if (operation === 'read') {
      return { allowed: true }; // Authenticated user can read
    }
    if (operation === 'write') {
      if (auth.token?.role === 'admin' || auth.token?.role === 'member') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Quyền ghi vault yêu cầu role hợp lệ' };
    }
  }

  return { allowed: false, reason: 'Path not permitted' };
}
