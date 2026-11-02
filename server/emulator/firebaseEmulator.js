import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Khởi tạo cặp khóa RSA bất đối xứng dành cho Firebase Emulator (RS256)
const { publicKey: EMULATOR_PUBLIC_KEY, privateKey: EMULATOR_PRIVATE_KEY } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

export const FIREBASE_EMULATOR_KEYS = {
  publicKey: EMULATOR_PUBLIC_KEY,
  privateKey: EMULATOR_PRIVATE_KEY
};

/**
 * Đọc file database.rules.json từ thư mục gốc
 */
export function loadDatabaseRules() {
  const rulesPath = path.join(__dirname, '..', '..', 'database.rules.json');
  if (fs.existsSync(rulesPath)) {
    return JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  }
  return { rules: { ".read": false, ".write": false } };
}

/**
 * Firebase Auth Emulator
 * Cung cấp cơ chế tạo và xác thực Custom Token, ID Token và Refresh Token theo chuẩn Google Firebase Identity Platform
 */
export class FirebaseAuthEmulator {
  constructor(projectId = 'secretletter-staging') {
    this.projectId = projectId;
    this.refreshTokens = new Map(); // Map<refreshToken, { uid, claims }>
  }

  /**
   * Tạo Firebase Custom Token được ký bằng RS256
   */
  createCustomToken(uid, claims = {}) {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({
      iss: `firebase-auth-emulator@${this.projectId}.iam.gserviceaccount.com`,
      sub: `firebase-auth-emulator@${this.projectId}.iam.gserviceaccount.com`,
      aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
      iat: now,
      exp: now + 3600,
      uid,
      claims
    })).toString('base64url');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${header}.${payload}`);
    const signature = signer.sign(EMULATOR_PRIVATE_KEY, 'base64url');

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Trao đổi Custom Token lấy Firebase ID Token (Mô phỏng POST signInWithCustomToken)
   */
  signInWithCustomToken(customToken) {
    if (!customToken || typeof customToken !== 'string') {
      throw new Error('INVALID_CUSTOM_TOKEN');
    }

    const parts = customToken.split('.');
    if (parts.length !== 3) {
      throw new Error('MALFORMED_JWT');
    }

    const [header, payload, signature] = parts;
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${header}.${payload}`);
    const isValid = verifier.verify(EMULATOR_PUBLIC_KEY, signature, 'base64url');

    if (!isValid) {
      throw new Error('INVALID_SIGNATURE');
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      throw new Error('TOKEN_EXPIRED');
    }

    const uid = decoded.uid;
    const claims = decoded.claims || {};

    // Cấp phát Firebase ID Token chính thức
    const idHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const idPayload = Buffer.from(JSON.stringify({
      iss: `https://securetoken.google.com/${this.projectId}`,
      aud: this.projectId,
      auth_time: now,
      user_id: uid,
      sub: uid,
      iat: now,
      exp: now + 3600,
      email: `${uid}@secretletter.local`,
      email_verified: true,
      firebase: { identities: {}, sign_in_provider: 'custom' },
      role: claims.role || 'member',
      username: claims.username || uid,
      ...claims
    })).toString('base64url');

    const idSigner = crypto.createSign('RSA-SHA256');
    idSigner.update(`${idHeader}.${idPayload}`);
    const idSignature = idSigner.sign(EMULATOR_PRIVATE_KEY, 'base64url');
    const idToken = `${idHeader}.${idPayload}.${idSignature}`;

    const refreshToken = `ref_${crypto.randomBytes(24).toString('hex')}`;
    this.refreshTokens.set(refreshToken, { uid, claims });

    return {
      idToken,
      refreshToken,
      expiresIn: '3600',
      user: {
        uid,
        role: claims.role || 'member',
        username: claims.username || uid
      }
    };
  }

  /**
   * Làm mới ID Token bằng Refresh Token (Mô phỏng SecureToken Endpoint)
   */
  refreshToken(refreshToken) {
    const session = this.refreshTokens.get(refreshToken);
    if (!session) {
      throw new Error('TOKEN_EXPIRED');
    }

    const now = Math.floor(Date.now() / 1000);
    const idHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const idPayload = Buffer.from(JSON.stringify({
      iss: `https://securetoken.google.com/${this.projectId}`,
      aud: this.projectId,
      auth_time: now,
      user_id: session.uid,
      sub: session.uid,
      iat: now,
      exp: now + 3600,
      role: session.claims.role || 'member',
      username: session.claims.username || session.uid,
      ...session.claims
    })).toString('base64url');

    const idSigner = crypto.createSign('RSA-SHA256');
    idSigner.update(`${idHeader}.${idPayload}`);
    const idSignature = idSigner.sign(EMULATOR_PRIVATE_KEY, 'base64url');

    return {
      idToken: `${idHeader}.${idPayload}.${idSignature}`,
      refreshToken,
      expiresIn: '3600'
    };
  }

  /**
   * Xác minh Firebase ID Token
   */
  verifyIdToken(idToken) {
    if (!idToken || typeof idToken !== 'string') return null;
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${header}.${payload}`);
    const isValid = verifier.verify(EMULATOR_PUBLIC_KEY, signature, 'base64url');
    if (!isValid) return null;

    try {
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) return null;
      return decoded;
    } catch {
      return null;
    }
  }
}

/**
 * Firebase Realtime Database Emulator
 * Nạp trực tiếp file database.rules.json và thực thi toàn bộ logic bảo mật, ETag & OCC
 */
export class FirebaseRtdbEmulator {
  constructor(authEmulator) {
    this.authEmulator = authEmulator;
    this.rulesConfig = loadDatabaseRules();
    this.store = {
      vault_data: null,
      admin: {},
      letters: {},
      users: {}
    };
    this.etags = new Map();
  }

  /**
   * Tạo ETag SHA-256 từ dữ liệu
   */
  _computeEtag(data) {
    return `"${crypto.createHash('sha256').update(JSON.stringify(data || null)).digest('hex').substring(0, 32)}"`;
  }

  /**
   * Kiểm tra quyền truy cập theo cấu hình database.rules.json
   */
  _evaluateRules({ pathParts, operation, auth, data, newData }) {
    const rules = this.rulesConfig.rules;

    // 1. Root level Deny-by-default
    if (!auth) {
      return { allowed: false, error: 'Permission denied: unauthenticated' };
    }

    const [collection, docId] = pathParts;

    if (collection === 'admin') {
      const isAdmin = auth.token?.role === 'admin';
      return isAdmin ? { allowed: true } : { allowed: false, error: 'Permission denied: admin claim required' };
    }

    if (collection === 'vault_data') {
      const isAdmin = auth.token?.role === 'admin';
      return isAdmin ? { allowed: true } : { allowed: false, error: 'Permission denied: master vault is admin only' };
    }

    if (collection === 'user_vaults') {
      if (!docId) {
        return auth.token?.role === 'admin' ? { allowed: true } : { allowed: false, error: 'Permission denied: listing vaults is admin only' };
      }
      const canAccess = auth.token?.role === 'admin' || auth.uid === docId;
      return canAccess ? { allowed: true } : { allowed: false, error: 'Permission denied: user vault isolation enforced' };
    }

    if (collection === 'letters') {
      if (!docId) {
        // Đọc toàn bộ letters chỉ admin
        return auth.token?.role === 'admin' ? { allowed: true } : { allowed: false, error: 'Permission denied: letter list is admin only' };
      }
      if (operation === 'read') {
        if (auth.token?.role === 'admin') return { allowed: true };
        const isRecipient = data?.recipientUsername && data.recipientUsername === auth.token?.username;
        const isSender = data?.senderId && data.senderId === auth.uid;
        const isBroadcast = data?.isBroadcast === true;
        if (isRecipient || isSender || isBroadcast) return { allowed: true };
        return { allowed: false, error: 'Permission denied: recipient or sender isolation enforced' };
      }
      if (operation === 'write') {
        if (auth.token?.role === 'admin') return { allowed: true };
        const senderMatches = newData?.senderId === auth.uid && (!data || data.senderId === auth.uid);
        if (senderMatches) return { allowed: true };
        return { allowed: false, error: 'Permission denied: sender cannot overwrite other letters' };
      }
    }

    if (collection === 'users') {
      if (operation === 'read') return { allowed: true };
      if (operation === 'write') {
        if (auth.token?.role === 'admin') return { allowed: true };
        // Chống Privilege Escalation: Member không thể tự gán role: 'admin'
        if (newData?.role === 'admin' && auth.token?.role !== 'admin') {
          return { allowed: false, error: 'Permission denied: privilege escalation blocked' };
        }
        if (auth.uid === docId) return { allowed: true };
        return { allowed: false, error: 'Permission denied: cannot modify other user accounts' };
      }
    }

    return { allowed: false, error: 'Permission denied: no matching rule' };
  }

  /**
   * Xử lý HTTP Request mô phỏng Firebase REST API
   * Hỗ trợ: GET, PUT, If-Match, query ?auth=
   */
  async handleRequest({ url, method = 'GET', headers = {}, body = null }) {
    const parsedUrl = new URL(url, 'http://localhost');
    let pathname = parsedUrl.pathname.replace(/^\//, '').replace(/\.json$/, '');
    const pathParts = pathname.split('/').filter(Boolean);
    const authToken = parsedUrl.searchParams.get('auth');

    // Xác thực Firebase ID Token
    let auth = null;
    if (authToken) {
      const decoded = this.authEmulator.verifyIdToken(authToken);
      if (!decoded) {
        return {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          data: { error: 'Invalid or expired Firebase ID token' }
        };
      }
      auth = {
        uid: decoded.user_id || decoded.sub,
        token: decoded
      };
    }

    const [collection, docId] = pathParts;
    const storeTarget = docId ? this.store[collection]?.[docId] : this.store[collection];
    const targetEtagKey = `${collection}/${docId || ''}`;
    const currentEtag = this.etags.get(targetEtagKey) || this._computeEtag(storeTarget);

    if (method === 'GET') {
      const evalResult = this._evaluateRules({
        pathParts,
        operation: 'read',
        auth,
        data: storeTarget
      });

      if (!evalResult.allowed) {
        return {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          data: { error: evalResult.error }
        };
      }

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'ETag': currentEtag
        },
        data: storeTarget || null
      };
    }

    if (method === 'PUT') {
      const evalResult = this._evaluateRules({
        pathParts,
        operation: 'write',
        auth,
        data: storeTarget,
        newData: body
      });

      if (!evalResult.allowed) {
        return {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          data: { error: evalResult.error }
        };
      }

      // Kiểm tra OCC: ETag & If-Match
      const ifMatch = headers['if-match'] || headers['If-Match'];
      if (ifMatch && ifMatch !== '*' && ifMatch !== currentEtag) {
        return {
          status: 412,
          headers: { 'Content-Type': 'application/json' },
          data: { error: 'Precondition Failed: ETag mismatch. Remote resource modified concurrently.' }
        };
      }

      // Lưu trữ dữ liệu
      if (docId) {
        if (!this.store[collection]) this.store[collection] = {};
        this.store[collection][docId] = body;
      } else {
        this.store[collection] = body;
      }

      const newEtag = this._computeEtag(body);
      this.etags.set(targetEtagKey, newEtag);

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'ETag': newEtag
        },
        data: body
      };
    }

    return {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
      data: { error: 'Method Not Allowed' }
    };
  }
}
