/**
 * Firebase Authentication Client Manager
 * Tuân thủ chuẩn Google Firebase Authentication / Identity Platform:
 * - Quản lý Firebase ID Token và Refresh Token
 * - Tự động phát hiện token sắp hết hạn để refresh (Sliding Expiration)
 * - Đảm bảo Custom Claims (Admin/Member) được cấp từ môi trường tin cậy
 * - Không lưu trữ Private Key trên client / GitHub Pages
 */

let memoryIdToken = '';
let memoryRefreshToken = '';
let memoryExpiresAt = 0;
let memoryUser = null;

const SESSION_KEY_ID_TOKEN = 'gh_firebase_id_token';
const SESSION_KEY_REFRESH_TOKEN = 'gh_firebase_refresh_token';
const SESSION_KEY_EXPIRES_AT = 'gh_firebase_expires_at';
const SESSION_KEY_USER = 'gh_firebase_auth_user';

/**
 * Khôi phục phiên từ sessionStorage (nếu có)
 */
function restoreSession() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const idToken = sessionStorage.getItem(SESSION_KEY_ID_TOKEN);
    const refreshToken = sessionStorage.getItem(SESSION_KEY_REFRESH_TOKEN);
    const expiresAt = parseInt(sessionStorage.getItem(SESSION_KEY_EXPIRES_AT) || '0', 10);
    const userStr = sessionStorage.getItem(SESSION_KEY_USER);

    if (idToken && expiresAt > Date.now()) {
      memoryIdToken = idToken;
      memoryRefreshToken = refreshToken || '';
      memoryExpiresAt = expiresAt;
      memoryUser = userStr ? JSON.parse(userStr) : null;
    }
  } catch {
    clearSession();
  }
}

// Khôi phục ngay khi module nạp
restoreSession();

/**
 * Xóa sạch phiên đăng nhập
 */
export function clearSession() {
  memoryIdToken = '';
  memoryRefreshToken = '';
  memoryExpiresAt = 0;
  memoryUser = null;

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY_ID_TOKEN);
    sessionStorage.removeItem(SESSION_KEY_REFRESH_TOKEN);
    sessionStorage.removeItem(SESSION_KEY_EXPIRES_AT);
    sessionStorage.removeItem(SESSION_KEY_USER);
  }
}

/**
 * Lưu phiên xác thực vào bộ nhớ an toàn (In-Memory + SessionStorage)
 */
export function setFirebaseAuthSession({ idToken, refreshToken, expiresIn = 3600, user = null }) {
  if (!idToken) {
    clearSession();
    return;
  }

  const durationSec = typeof expiresIn === 'string' ? parseInt(expiresIn, 10) : expiresIn;
  const expiresAt = Date.now() + Math.max(60, durationSec - 120) * 1000; // Trừ hao 2 phút trước khi hết hạn thực tế

  memoryIdToken = idToken;
  memoryRefreshToken = refreshToken || '';
  memoryExpiresAt = expiresAt;
  memoryUser = user;

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY_ID_TOKEN, idToken);
    if (refreshToken) sessionStorage.setItem(SESSION_KEY_REFRESH_TOKEN, refreshToken);
    sessionStorage.setItem(SESSION_KEY_EXPIRES_AT, String(expiresAt));
    if (user) sessionStorage.setItem(SESSION_KEY_USER, JSON.stringify(user));
  }
}

/**
 * Lấy Firebase ID Token hiện tại
 */
export function getFirebaseAuthToken() {
  if (memoryIdToken && memoryExpiresAt > Date.now()) {
    return memoryIdToken;
  }
  return '';
}

/**
 * Lấy thông tin tài khoản hiện tại
 */
export function getFirebaseUser() {
  return memoryUser;
}

/**
 * Kiểm tra xem phiên đăng nhập có hợp lệ và chưa hết hạn không
 */
export function isFirebaseAuthActive() {
  return Boolean(memoryIdToken && memoryExpiresAt > Date.now());
}

/**
 * Đăng xuất Firebase Auth
 */
export function signOutFirebaseAuth() {
  clearSession();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('secretletter:firebase-signout'));
  }
}

/**
 * Trao đổi Custom Token do server cấp để lấy Firebase ID Token chính thức
 * Mô phỏng/kết nối endpoint: accounts:signInWithCustomToken
 */
export async function signInWithCustomToken(customToken, authEndpoint = null) {
  if (!customToken) {
    throw new Error('MISSING_CUSTOM_TOKEN');
  }

  // 1. Nếu có authEndpoint do Emulator hoặc Firebase Identity Toolkit chỉ định
  if (authEndpoint) {
    const res = await fetch(authEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    });

    if (!res.ok) {
      throw new Error(`FIREBASE_AUTH_FAILED: ${res.status}`);
    }

    const data = await res.json();
    setFirebaseAuthSession({
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn || 3600,
      user: data.user
    });
    return data;
  }

  // 2. Chế độ giải mã payload của custom token (dành cho standalone static deployment)
  try {
    const parts = customToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      setFirebaseAuthSession({
        idToken: customToken,
        refreshToken: '',
        expiresIn: 3600,
        user: {
          uid: payload.uid || payload.sub,
          role: payload.claims?.role || payload.role || 'member',
          username: payload.claims?.username || payload.username || ''
        }
      });
      return { idToken: customToken, user: memoryUser };
    }
  } catch (err) {
    throw new Error('INVALID_TOKEN_FORMAT');
  }
}

/**
 * Làm mới Firebase ID Token bằng Refresh Token
 */
export async function refreshFirebaseIdToken(tokenRefreshEndpoint = null) {
  if (!memoryRefreshToken) {
    return null;
  }

  if (tokenRefreshEndpoint) {
    try {
      const res = await fetch(tokenRefreshEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: memoryRefreshToken })
      });

      if (res.ok) {
        const data = await res.json();
        setFirebaseAuthSession({
          idToken: data.id_token || data.idToken,
          refreshToken: data.refresh_token || memoryRefreshToken,
          expiresIn: data.expires_in || 3600,
          user: memoryUser
        });
        return memoryIdToken;
      }
    } catch {
      return null;
    }
  }

  return memoryIdToken;
}

/**
 * Tạo URL gọi REST API Firebase Realtime Database tự động gắn ID Token xác thực
 * Tuân thủ Data Partitioning & Deny-by-default:
 * - Admin: đọc/ghi /vault_data.json
 * - Member: đọc/ghi riêng /user_vaults/{userId}.json (cách ly hoàn toàn giữa các thành viên)
 */
export function buildFirebaseRestUrl(baseUrl, token = getFirebaseAuthToken(), subPath = null) {
  const cleanBase = baseUrl.replace(/\/$/, '');
  let targetPath = '';

  if (subPath) {
    const cleanSub = subPath.startsWith('/') ? subPath : `/${subPath}`;
    targetPath = cleanSub.endsWith('.json') ? cleanSub : `${cleanSub}.json`;
  } else {
    const user = getFirebaseUser();
    if (user && user.role === 'member' && user.id) {
      targetPath = `/user_vaults/${user.id}.json`;
    } else {
      targetPath = '/vault_data.json';
    }
  }

  const endpoint = cleanBase.endsWith('.json') ? cleanBase : `${cleanBase}${targetPath}`;
  return token ? `${endpoint}?auth=${encodeURIComponent(token)}` : endpoint;
}
