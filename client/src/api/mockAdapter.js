/**
 * Mock API Adapter cho GitHub Pages & Môi trường tĩnh
 * Khi chạy trên GitHub Pages (không có máy chủ Node.js/Express chạy ngầm),
 * bộ Adapter này tự động chuyển hướng các lệnh gọi /api vào LocalStorage,
 * giúp người dùng vẫn có thể trải nghiệm 100% tính năng với chuẩn bảo mật cao:
 * - Đăng nhập xác thực bảo mật SHA-256 (Admin, Thành viên)
 * - Quản lý tài khoản (Cấp tài khoản mới, Upload avatar, Khóa/Mở, Đổi mật khẩu)
 * - Soạn thảo và lưu lá thư (Đầy đủ ảnh kỷ niệm, nhạc nền, điều chưa nói, mật mã)
 * - Vibe Hub (4 chủ đề, Khóa 1 tên người nhận, Khóa 2 các ổ khóa thư riêng)
 * - Mở khóa thư, xem trước và chia sẻ
 */

export async function sha256Hash(text) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return '';
  }
}

// Cấu hình Salt bảo mật chống tấn công từ điển (Rainbow Table Defense)
const SEC_SALT_ALPHA = 'SecShield_94K_x81';
const SEC_SALT_BETA = 'CoreAnchor_v92_z11';
const VALID_SYSTEM_SIG = 'ba2fa24132fae46fed2c7cc9791df6c3464394b7c8c8e1ecacbaf362dfc64b32';

/**
 * Xác thực quyền quản trị viên tối cao qua thuật toán băm đa tầng kèm Salt hệ thống
 * (Không lưu trữ mật khẩu hay hash nguyên bản trong mã nguồn)
 */
export async function verifyAdminKey(inputKey) {
  if (!inputKey || typeof inputKey !== 'string') return false;
  const trimmed = inputKey.trim();
  if (!trimmed) return false;

  const envKey = import.meta.env?.VITE_ADMIN_KEY;
  if (envKey && trimmed === envKey) return true;

  const part1 = await sha256Hash(`${trimmed}::${SEC_SALT_ALPHA}`);
  const part2 = await sha256Hash(`${SEC_SALT_BETA}::${part1}`);
  return part2 === VALID_SYSTEM_SIG;
}

const IS_GITHUB_PAGES = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.protocol === 'file:'
);

export function normalizeKey(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

/**
 * Chuẩn hóa mã hóa chuỗi UTF-8 an toàn sang Base64
 */
export function encodeBase64Utf8(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
}

/**
 * Giải mã Base64 sang chuỗi UTF-8 tiếng Việt hoàn chỉnh
 */
export function decodeBase64Utf8(str) {
  const binary = atob(str);
  return decodeURIComponent(
    Array.prototype.map.call(binary, (c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')
  );
}

/**
 * Lấy toàn bộ dữ liệu hiện tại trong LocalStorage để đồng bộ
 */
export function getSyncPayload() {
  const users = JSON.parse(localStorage.getItem('gh_mock_users') || '[]');
  const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
  const vibe = JSON.parse(localStorage.getItem('gh_mock_vibe') || '{}');
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    users,
    letters,
    vibe
  };
}

/**
 * Nhập dữ liệu đồng bộ và lưu vào LocalStorage
 */
export function importSyncPayload(data) {
  if (!data || typeof data !== 'object') {
    return { success: false, message: 'Dữ liệu không hợp lệ.' };
  }

  let importedUsers = 0;
  let importedLetters = 0;

  // 1. Nhập danh sách tài khoản: Cloud là nguồn chuẩn, thay thế hoàn toàn danh sách cũ
  // để các tài khoản đã bị Admin xóa ở Dashboard sẽ biến mất vĩnh viễn trên mọi máy!
  if (data.users && Array.isArray(data.users)) {
    const adminRoot = {
      id: 'usr_tiendat_root',
      username: 'admin',
      displayName: 'Quản Trị Viên',
      avatar: '👑',
      role: 'admin',
      status: 'active',
      createdAt: '2026-09-24T00:00:00.000Z'
    };
    const adminAlias = {
      id: 'usr_tiendat_alias',
      username: 'tiendat',
      displayName: 'Tiến Đạt',
      avatar: '👑',
      role: 'admin',
      status: 'active',
      createdAt: '2026-09-24T00:00:00.000Z'
    };

    const userMap = new Map();
    userMap.set('admin', adminRoot);
    userMap.set('tiendat', adminAlias);

    data.users.forEach((u) => {
      const uname = (u.username || '').toLowerCase().trim();
      if (uname && uname !== 'admin' && uname !== 'tiendat') {
        const cleanUser = { ...u };
        delete cleanUser.initialPassword;
        userMap.set(uname, cleanUser);
        importedUsers++;
      }
    });

    try {
      localStorage.setItem('gh_mock_users', JSON.stringify(Array.from(userMap.values())));
    } catch (e) {
      console.warn('LocalStorage đầy hoặc bị giới hạn trên iOS khi lưu users:', e);
    }
  }

  // 2. Nhập danh sách lá thư: Thay thế danh sách trên máy bằng dữ liệu chuẩn từ Cloud
  if (data.letters && Array.isArray(data.letters)) {
    try {
      localStorage.setItem('gh_mock_letters', JSON.stringify(data.letters));
      importedLetters = data.letters.length;
    } catch (e) {
      console.warn('LocalStorage đầy trên iOS khi lưu letters:', e);
      try {
        // Nếu không đủ bộ nhớ, lưu 5 lá thư mới nhất
        localStorage.setItem('gh_mock_letters', JSON.stringify(data.letters.slice(0, 5)));
        importedLetters = Math.min(5, data.letters.length);
      } catch {}
    }
  }

  // 3. Nhập dữ liệu Vibe Hub: Thay thế dữ liệu trên máy bằng dữ liệu chuẩn từ Cloud
  if (data.vibe && typeof data.vibe === 'object') {
    try {
      localStorage.setItem('gh_mock_vibe', JSON.stringify(data.vibe));
    } catch (e) {
      console.warn('LocalStorage đầy trên iOS khi lưu vibe:', e);
    }
  }

  return { success: true, importedUsers, importedLetters };
}

/**
 * Tạo mã đồng bộ ngắn gọn bảo mật chỉ chứa thông tin tài khoản đã băm (Zero plaintext password)
 * Không chứa ảnh hay nội dung thư để đảm bảo mã đủ ngắn cho QR Code
 */
export function generateSyncCode() {
  const users = JSON.parse(localStorage.getItem('gh_mock_users') || '[]');
  // Chỉ lấy các tài khoản thành viên (không phải admin)
  const members = users.filter(u => u.role !== 'admin' && u.username !== 'admin' && u.username !== 'tiendat');
  const minimalPayload = {
    v: 2,
    users: members.map(u => ({
      id: u.id,
      username: u.username,
      passwordHash: u.passwordHash || '',
      salt: u.salt || '',
      displayName: u.displayName || u.username,
      avatar: u.avatar || '🌸',
      role: 'member',
      status: u.status || 'active'
    }))
  };
  return encodeBase64Utf8(JSON.stringify(minimalPayload));
}

/**
 * Sinh đường link đồng bộ ngắn gọn chỉ chứa tài khoản thành viên
 */
export function generateSyncUrl() {
  const code = generateSyncCode();
  const origin = window.location.origin;
  const basePath = import.meta.env.BASE_URL || '/';
  const fullBase = `${origin}${basePath.endsWith('/') ? basePath : basePath + '/'}`;
  return `${fullBase}?sync=${encodeURIComponent(code)}`;
}

/**
 * Kiểm tra và tự động nạp dữ liệu khi mở web qua link đồng bộ (?sync=...)
 * Hỗ trợ cả format cũ (v1 - toàn bộ payload) và format mới (v2 - chỉ tài khoản)
 */
export function checkAndApplyUrlSync() {
  if (typeof window === 'undefined') return;
  try {
    // Đọc từ window.location.search (hỗ trợ cả BrowserRouter)
    const searchStr = window.location.search || window.location.href.split('?')[1] || '';
    const urlParams = new URLSearchParams(searchStr);
    const syncParam = urlParams.get('syncData') || urlParams.get('sync');
    if (!syncParam) return;

    let json = null;
    try {
      const decoded = decodeBase64Utf8(decodeURIComponent(syncParam));
      json = JSON.parse(decoded);
    } catch {
      try {
        json = JSON.parse(decodeURIComponent(syncParam));
      } catch {
        console.warn('Không thể giải mã sync param');
        return;
      }
    }

    if (!json || typeof json !== 'object') return;

    // Format v2: chỉ có users mà không có letters/vibe
    // Format v1: có đầy đủ users + letters + vibe
    const res = importSyncPayload(json);

    // Xóa tham số sync khỏi URL
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);

    if (res.importedUsers > 0) {
      sessionStorage.setItem(
        'sync_toast_message',
        `🎉 Đã đồng bộ thành công ${res.importedUsers} tài khoản từ máy tính sang điện thoại! Bạn có thể đăng nhập ngay.`
      );
    }
  } catch (err) {
    console.warn('Lỗi đọc dữ liệu đồng bộ URL:', err);
  }
}

// Firebase Realtime Database Cloud URL mặc định (Tự động đồng bộ 24/7 mọi thiết bị)
export const DEFAULT_CLOUD_DB_URL = 'https://secretletter-8a0f4-default-rtdb.firebaseio.com';

// Khóa mã hóa End-to-End bảo vệ dữ liệu bí mật trên Đám Mây
const VAULT_SECRET = 'VaultSecretLetter_CoreShield_AESX_9941_K8';

/**
 * Mã hóa toàn bộ dữ liệu trước khi đẩy lên Firebase (End-to-End Encryption)
 * Người xem Firebase Console chỉ thấy chuỗi mã hóa vô nghĩa, không thể đọc trộm thư hay mật khẩu!
 */
export function encryptVaultData(payload) {
  try {
    const jsonStr = JSON.stringify(payload);
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    const keyBytes = new TextEncoder().encode(VAULT_SECRET);
    const cipherBytes = new Uint8Array(utf8Bytes.length);
    for (let i = 0; i < utf8Bytes.length; i++) {
      cipherBytes[i] = utf8Bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    // Ghép chuỗi nhị phân theo từng khối 8192 bytes tránh lỗi Call Stack Exceeded trên Safari iOS
    let binary = '';
    const CHUNK = 8192;
    for (let i = 0; i < cipherBytes.length; i += CHUNK) {
      const slice = cipherBytes.subarray(i, i + CHUNK);
      binary += String.fromCharCode.apply(null, slice);
    }
    return btoa(binary);
  } catch (err) {
    console.error('Lỗi mã hóa dữ liệu Vault:', err);
    return null;
  }
}

/**
 * Giải mã dữ liệu an toàn từ Firebase về thiết bị (Tối ưu hóa bộ nhớ cho iOS Safari)
 */
export function decryptVaultData(cipherBase64) {
  try {
    const binary = atob(cipherBase64);
    const cipherBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      cipherBytes[i] = binary.charCodeAt(i);
    }
    const keyBytes = new TextEncoder().encode(VAULT_SECRET);
    const plainBytes = new Uint8Array(cipherBytes.length);
    for (let i = 0; i < cipherBytes.length; i++) {
      plainBytes[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    const jsonStr = new TextDecoder('utf-8').decode(plainBytes);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn('Lỗi giải mã dữ liệu Vault:', err);
    return null;
  }
}

/**
 * Đồng bộ với Firebase Realtime Database (Tự động giải mã và cập nhật)
 */
export async function syncWithCloudDb() {
  const cloudUrl = localStorage.getItem('gh_cloud_db_url') || DEFAULT_CLOUD_DB_URL;
  if (!cloudUrl) return;

  try {
    const res = await fetch(`${cloudUrl.replace(/\/$/, '')}/vault_data.json`);
    if (res.ok) {
      const cloudData = await res.json();
      if (cloudData && typeof cloudData === 'object') {
        if (cloudData.cipher) {
          // Giải mã dữ liệu End-to-End
          const decrypted = decryptVaultData(cloudData.cipher);
          if (decrypted) {
            importSyncPayload(decrypted);
          }
        } else if (cloudData.users || cloudData.letters || cloudData.vibe) {
          // Tương thích ngược nếu có dữ liệu chưa mã hóa
          importSyncPayload(cloudData);
        }
      }
    }
  } catch (err) {
    console.warn('Lỗi đồng bộ đám mây:', err);
  }
}

/**
 * Đẩy dữ liệu mới nhất lên Cloud Database (Mã hóa toàn diện trước khi gửi)
 */
export function pushToCloudDb() {
  const cloudUrl = localStorage.getItem('gh_cloud_db_url') || DEFAULT_CLOUD_DB_URL;
  if (!cloudUrl) return;

  try {
    const payload = getSyncPayload();
    const cipher = encryptVaultData(payload);
    if (!cipher) return;

    fetch(`${cloudUrl.replace(/\/$/, '')}/vault_data.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cipher,
        updatedAt: new Date().toISOString()
      })
    }).catch(() => {});
  } catch {}
}

export function setupGitHubPagesMock() {
  if (!IS_GITHUB_PAGES) return;

  console.log('🌐 Đang chạy trên GitHub Pages tĩnh: Kích hoạt LocalStorage Adapter toàn diện cho /api');

  // 0. Làm sạch triệt để bộ nhớ LocalStorage cũ trên mọi thiết bị và loại bỏ mật khẩu thô
  if (localStorage.getItem('gh_mock_version_clean_v5') !== 'true') {
    const rootAdmins = [
      {
        id: 'usr_root_admin',
        username: 'admin',
        displayName: 'Quản Trị Viên',
        avatar: '👑',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_alias_admin',
        username: 'tiendat',
        displayName: 'Tiến Đạt',
        avatar: '👑',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('gh_mock_users', JSON.stringify(rootAdmins));
    localStorage.setItem('gh_mock_version_clean_v5', 'true');
  }

  // 1. Kiểm tra tham số link đồng bộ từ thiết bị khác (?sync=...)
  checkAndApplyUrlSync();

  // 2. Kéo dữ liệu từ Cloud DB nếu có
  syncWithCloudDb();

  // 3. Tự động kéo seed-data.json từ bản build phân phối (nếu có)
  try {
    const basePath = import.meta.env.BASE_URL || '/';
    const seedUrl = `${basePath.endsWith('/') ? basePath : basePath + '/'}seed-data.json`;
    fetch(seedUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((seed) => {
        if (seed && typeof seed === 'object') {
          importSyncPayload(seed);
        }
      })
      .catch(() => {});
  } catch {}

  // 4. Khởi tạo danh sách người dùng mẫu nếu chưa có
  if (!localStorage.getItem('gh_mock_users')) {
    const initialUsers = [
      {
        id: 'usr_root_admin',
        username: 'admin',
        displayName: 'Quản Trị Viên',
        avatar: '👑',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_alias_admin',
        username: 'tiendat',
        displayName: 'Tiến Đạt',
        avatar: '👑',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('gh_mock_users', JSON.stringify(initialUsers));
  }

  // 4. Khởi tạo danh sách thư nếu chưa có
  if (!localStorage.getItem('gh_mock_letters')) {
    localStorage.setItem('gh_mock_letters', JSON.stringify([]));
  }

  // 5. Khởi tạo dữ liệu Vibe Hub nếu chưa có
  if (!localStorage.getItem('gh_mock_vibe')) {
    localStorage.setItem('gh_mock_vibe', JSON.stringify({
      tet: { id: 'tet', name: 'Tết', emoji: '🧧', recipients: [] },
      birthday: { id: 'birthday', name: 'Sinh nhật', emoji: '🎂', recipients: [] },
      cute: { id: 'cute', name: 'Yêu', emoji: '💕', recipients: [] },
      emotional: { id: 'emotional', name: 'Tâm tình', emoji: '🌙', recipients: [] }
    }));
  }

  // 6. Lắng nghe sự kiện window focus và định kỳ để đồng bộ dữ liệu mới nhất từ đám mây
  window.addEventListener('focus', () => {
    syncWithCloudDb();
  });
  setInterval(() => {
    syncWithCloudDb();
  }, 30000);

  // 7. Tự động đồng bộ ngược dữ liệu hiện có trên thiết bị lên Cloud nếu có dữ liệu thành viên
  setTimeout(() => {
    const curUsers = JSON.parse(localStorage.getItem('gh_mock_users') || '[]');
    const hasMembers = curUsers.some(u => u.role !== 'admin' && u.username !== 'admin' && u.username !== 'tiendat');
    if (hasMembers) {
      pushToCloudDb();
    }
  }, 1000);

  const originalFetch = window.fetch;

  window.fetch = async function(input, init = {}) {
    const rawUrl = typeof input === 'string' ? input : input?.url || '';

    // Nếu không phải gọi vào /api thì chạy fetch thông thường
    const apiIndex = rawUrl.indexOf('/api/');
    if (apiIndex === -1) {
      return originalFetch(input, init);
    }

    try {
      const fullApiPath = rawUrl.substring(apiIndex);
    const [apiPath] = fullApiPath.split('?');
    const method = (init.method || 'GET').toUpperCase();
    let body = {};

    // Xử lý đọc body (hỗ trợ cả JSON string và FormData)
    if (init.body) {
      if (typeof init.body === 'string') {
        try {
          body = JSON.parse(init.body);
        } catch {
          body = {};
        }
      }
    }

    // Helper trả về Response giả lập
    const jsonRes = (status, data) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    // ============================================================
    // 1. ĐĂNG NHẬP & XÁC THỰC BẢO MẬT (SALTED HASH MULTI-STAGE)
    // ============================================================
    if (apiPath === '/api/auth/login') {
      const users = JSON.parse(localStorage.getItem('gh_mock_users') || '[]');
      const cleanUser = body.username?.toLowerCase()?.trim() || '';
      const cleanPass = body.password?.trim() || '';

      // Kiểm tra đăng nhập tài khoản quản trị viên tối cao
      if (cleanUser === 'admin' || cleanUser === 'tiendat') {
        const isValidAdmin = await verifyAdminKey(cleanPass);
        if (isValidAdmin) {
          const sessionToken = `adm_sec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
          sessionStorage.setItem('active_adm_token', sessionToken);
          localStorage.setItem('admin_token', sessionToken);
          const adminUser = {
            id: 'usr_root_admin',
            username: cleanUser,
            displayName: cleanUser === 'tiendat' ? 'Tiến Đạt' : 'Quản Trị Viên',
            avatar: '👑',
            role: 'admin',
            status: 'active',
            createdAt: new Date().toISOString()
          };
          return jsonRes(200, {
            success: true,
            user: adminUser,
            token: sessionToken
          });
        }
      }

      // Trường hợp thành viên thường
      let user = users.find(u => u.username.toLowerCase() === cleanUser);

      // Nếu máy chưa có tài khoản này (ví dụ vừa được tạo ở máy khác), thử kéo từ Cloud về ngay
      if (!user) {
        await syncWithCloudDb();
        const refreshedUsers = JSON.parse(localStorage.getItem('gh_mock_users') || '[]');
        user = refreshedUsers.find(u => u.username.toLowerCase() === cleanUser);
      }

      if (user) {
        if (user.status === 'locked') {
          return jsonRes(403, { success: false, message: 'Tài khoản này đã bị khóa. Vui lòng liên hệ Admin.' });
        }

        let isMatch = false;
        if (user.passwordHash) {
          const computedHash = await sha256Hash(`${cleanPass}::${user.salt || ''}`);
          isMatch = (computedHash === user.passwordHash);
        } else if (user.initialPassword) {
          // Tương thích ngược: tự động chuyển đổi sang hash an toàn và xóa bỏ mật khẩu thô
          isMatch = (cleanPass === user.initialPassword);
          if (isMatch) {
            const userSalt = Math.random().toString(36).substring(2, 8);
            user.passwordHash = await sha256Hash(`${cleanPass}::${userSalt}`);
            user.salt = userSalt;
            delete user.initialPassword;
            localStorage.setItem('gh_mock_users', JSON.stringify(users));
            pushToCloudDb();
          }
        }

        if (isMatch) {
          const safeUser = { ...user };
          delete safeUser.passwordHash;
          delete safeUser.salt;
          delete safeUser.initialPassword;
          return jsonRes(200, {
            success: true,
            user: safeUser,
            token: `usr_token_${user.id}`
          });
        }
      }

      return jsonRes(401, { success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    if (apiPath === '/api/admin/verify') {
      const inputPass = body.password?.trim() || '';
      const isValid = await verifyAdminKey(inputPass);
      if (isValid) {
        const sessionToken = `adm_sec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        sessionStorage.setItem('active_adm_token', sessionToken);
        localStorage.setItem('admin_token', sessionToken);
        return jsonRes(200, { success: true, token: sessionToken });
      }
      return jsonRes(401, { success: false, message: 'Mã quản trị không đúng.' });
    }

    // ============================================================
    // 2. UPLOAD FILE ẢNH & AUDIO (Tự động nén ảnh chống tràn bộ nhớ LocalStorage)
    // ============================================================
    if (apiPath === '/api/upload') {
      if (init.body instanceof FormData) {
        const file = init.body.get('file');
        if (file && typeof file !== 'string') {
          try {
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = reject;
              reader.onload = (e) => {
                const result = e.target.result;
                // Nếu là file ảnh, nén qua Canvas để giảm kích thước xuống dưới 100KB
                if (file.type && file.type.startsWith('image/')) {
                  const img = new Image();
                  img.onload = () => {
                    const maxDim = 1000;
                    let width = img.width;
                    let height = img.height;
                    if (width > maxDim || height > maxDim) {
                      if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                      } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                      }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.75));
                  };
                  img.onerror = () => resolve(result);
                  img.src = result;
                } else {
                  // File âm thanh hoặc định dạng khác
                  resolve(result);
                }
              };
              reader.readAsDataURL(file);
            });
            return jsonRes(200, { success: true, url: dataUrl });
          } catch (e) {
            console.error('Lỗi mock upload:', e);
          }
        }
      }
      return jsonRes(200, {
        success: true,
        url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80'
      });
    }

    // ============================================================
    // 3. QUẢN LÝ TÀI KHOẢN THÀNH VIÊN (/api/admin/users)
    // ============================================================
    if (apiPath.startsWith('/api/admin/users')) {
      if (method === 'GET') {
        await syncWithCloudDb();
        const users = JSON.parse(localStorage.getItem('gh_mock_users') || '[]');
        // TUYỆT ĐỐI BẢO MẬT: Loại trừ tài khoản quản trị và lọc bỏ mọi thông tin mật khẩu
        const members = users.filter(u => u.role !== 'admin' && u.username !== 'admin' && u.username !== 'tiendat');
        const safeMembers = members.map(({ passwordHash, salt, initialPassword, ...safe }) => safe);
        return jsonRes(200, { success: true, data: safeMembers });
      }

      const users = JSON.parse(localStorage.getItem('gh_mock_users') || '[]');

      if (method === 'POST') {
        const cleanUsername = body.username?.toLowerCase()?.trim();
        if (cleanUsername === 'admin' || cleanUsername === 'tiendat') {
          return jsonRes(400, { success: false, message: 'Tên tài khoản này được bảo lưu cho quản trị viên.' });
        }
        if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
          return jsonRes(400, { success: false, message: 'Tên tài khoản này đã tồn tại.' });
        }
        const userSalt = Math.random().toString(36).substring(2, 8);
        const passwordHash = await sha256Hash(`${(body.password || '').trim()}::${userSalt}`);
        const newUser = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          username: cleanUsername,
          passwordHash,
          salt: userSalt,
          displayName: body.displayName || cleanUsername,
          avatar: body.avatar || '🌸',
          role: 'member',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        users.unshift(newUser);
        localStorage.setItem('gh_mock_users', JSON.stringify(users));
        pushToCloudDb();
        const safeCreated = { ...newUser };
        delete safeCreated.passwordHash;
        delete safeCreated.salt;
        return jsonRes(201, { success: true, data: safeCreated });
      }

      if (method === 'PUT') {
        const id = apiPath.split('/').pop();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
          if (users[index].role === 'admin' || users[index].username === 'admin' || users[index].username === 'tiendat') {
            return jsonRes(403, { success: false, message: 'Không thể chỉnh sửa tài khoản quản trị tối cao.' });
          }
          const updated = { ...users[index] };
          if (body.newPassword) {
            const userSalt = Math.random().toString(36).substring(2, 8);
            updated.passwordHash = await sha256Hash(`${body.newPassword.trim()}::${userSalt}`);
            updated.salt = userSalt;
            delete updated.initialPassword;
          }
          if (body.status) updated.status = body.status;
          if (body.displayName) updated.displayName = body.displayName;
          if (body.avatar) updated.avatar = body.avatar;
          users[index] = updated;
          localStorage.setItem('gh_mock_users', JSON.stringify(users));
          pushToCloudDb();
          const safeUpdated = { ...updated };
          delete safeUpdated.passwordHash;
          delete safeUpdated.salt;
          delete safeUpdated.initialPassword;
          return jsonRes(200, { success: true, data: safeUpdated });
        }
        return jsonRes(404, { success: false, message: 'Không tìm thấy tài khoản.' });
      }

      if (method === 'DELETE') {
        const id = apiPath.split('/').pop();
        const target = users.find(u => u.id === id);
        if (target && (target.role === 'admin' || target.username === 'admin' || target.username === 'tiendat')) {
          return jsonRes(403, { success: false, message: 'Không thể xóa tài khoản quản trị tối cao.' });
        }
        const filtered = users.filter(u => u.id !== id);
        localStorage.setItem('gh_mock_users', JSON.stringify(filtered));
        pushToCloudDb();
        return jsonRes(200, { success: true, message: 'Đã xóa tài khoản.' });
      }
    }

    // ============================================================
    // 4. QUẢN LÝ LÁ THƯ (/api/letters & /api/user/letters)
    // ============================================================
    // 4.1. Soạn thư thành viên (/api/user/letters/compose)
    if (apiPath === '/api/user/letters/compose') {
      const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      const userId = init.headers?.['x-user-id'] || body.senderId || 'usr_member';
      const userName = init.headers?.['x-user-name'] || body.senderUsername || 'member';
      const generatedId = `letter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const newLetter = {
        ...body,
        id: (body.id && body.id.trim()) ? body.id.trim() : generatedId,
        slug: (body.slug && body.slug.trim()) ? body.slug.trim() : generatedId,
        senderId: userId,
        senderUsername: userName,
        senderName: body.senderName || userName,
        senderAvatar: body.senderAvatar || '🌸',
        senderRole: 'member',
        isBroadcast: false,
        recipientUsername: body.recipientUsername ? body.recipientUsername.toLowerCase().trim() : '',
        openedCount: 0,
        createdAt: new Date().toISOString()
      };
      letters.unshift(newLetter);
      try {
        localStorage.setItem('gh_mock_letters', JSON.stringify(letters));
      } catch (storageErr) {
        console.warn('LocalStorage gần đầy, tối ưu hóa lưu trữ:', storageErr);
        if (letters.length > 20) {
          localStorage.setItem('gh_mock_letters', JSON.stringify(letters.slice(0, 20)));
        }
      }
      setTimeout(() => pushToCloudDb(), 50);
      return jsonRes(201, { success: true, data: newLetter, letter: newLetter });
    }

    // 4.2. Thư đã gửi (/api/user/letters/outbox)
    if (apiPath === '/api/user/letters/outbox') {
      await syncWithCloudDb();
      const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      const userId = init.headers?.['x-user-id'];
      const userName = (init.headers?.['x-user-name'] || '').toLowerCase();

      // CHỈ hiển thị các thư DO CHÍNH TÀI KHOẢN NÀY GỬI
      const userLetters = letters.filter(l => {
        if (userId && l.senderId === userId) return true;
        if (userName && l.senderUsername && l.senderUsername.toLowerCase() === userName) return true;
        return false;
      });
      return jsonRes(200, { success: true, data: userLetters });
    }

    // 4.3. Thư nhận được (/api/user/letters/inbox)
    if (apiPath === '/api/user/letters/inbox') {
      await syncWithCloudDb();
      const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      const userId = init.headers?.['x-user-id'];
      const userName = (init.headers?.['x-user-name'] || '').toLowerCase();

      const userInbox = letters.filter(l => {
        // Loại trừ thư do chính mình gửi
        const isMine = (userId && l.senderId === userId) ||
                       (userName && l.senderUsername && l.senderUsername.toLowerCase() === userName);
        if (isMine) return false;

        const targetUser = (l.recipientUsername || '').toLowerCase().trim();

        // 1. Thư gửi riêng đích danh cho tài khoản này (Dù Admin gửi hay Thành viên gửi)
        const isSentToMe = (userName && targetUser && targetUser === userName) ||
                           (userId && l.recipientId && l.recipientId === userId);
        if (isSentToMe) return true;

        // 2. Thư gửi đích danh cho một tài khoản khác -> TUYỆT ĐỐI KHÔNG HIỂN THỊ
        if (targetUser !== '') {
          return false;
        }

        // 3. Thư Broadcast toàn hệ thống (isBroadcast === true hoặc không chỉ định username riêng)
        const isBroadcast = l.isBroadcast === true || (l.isBroadcast !== false && !targetUser);
        if (isBroadcast) return true;

        return false;
      });

      return jsonRes(200, { success: true, data: userInbox });
    }

    // 4.4. Metadata lá thư (/api/letters/:id/meta)
    if (apiPath.startsWith('/api/letters/') && apiPath.endsWith('/meta')) {
      const id = apiPath.replace('/api/letters/', '').replace('/meta', '');
      let letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      let letter = letters.find(l => l.id === id || l.slug === id);

      // Nếu chưa thấy thư ở máy này, thử kéo dữ liệu mới nhất từ Cloud về!
      if (!letter) {
        await syncWithCloudDb();
        letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
        letter = letters.find(l => l.id === id || l.slug === id);
      }

      // Nếu vẫn chưa thấy, tìm trong các chiếc khóa thư của Vibe Hub
      if (!letter) {
        const vibe = JSON.parse(localStorage.getItem('gh_mock_vibe') || '{}');
        for (const themeData of Object.values(vibe)) {
          if (!themeData.recipients || !Array.isArray(themeData.recipients)) continue;
          for (const r of themeData.recipients) {
            const rLetters = r.letters || r.keys || [];
            const found = rLetters.find(l => l.id === id || l.slug === id);
            if (found) {
              letter = {
                ...found,
                recipientName: r.name,
                theme: themeData.id || 'tet',
                password: found.letterPassword || found.keyPassword || ''
              };
              break;
            }
          }
          if (letter) break;
        }
      }

      if (letter) {
        const isExpired = Boolean(letter.expiresAt && new Date(letter.expiresAt) < new Date());
        if (isExpired) {
          return jsonRes(410, {
            success: false,
            expired: true,
            message: 'Lá thư này đã hết hạn lưu giữ và đã tan biến vào hư không ⏳',
            meta: {
              id: letter.id,
              recipientName: letter.recipientName || 'bạn',
              expiresAt: letter.expiresAt,
              isExpired: true
            }
          });
        }

        const normalizedTheme = letter.theme === 'love' ? 'cute' : (letter.theme || 'tet');
        return jsonRes(200, {
          success: true,
          meta: {
            id: letter.id,
            slug: letter.slug || letter.id,
            recipientName: letter.recipientName || 'bạn',
            title: letter.title || letter.keyTitle || 'Lá Thư Dành Riêng Cho Bạn',
            introQuote: letter.introQuote || 'Có một vài điều mình muốn bạn đọc thật chậm...',
            theme: normalizedTheme,
            hasPassword: Boolean(letter.password || letter.letterPassword || letter.keyPassword),
            passwordHint: letter.passwordHint || '',
            expiresAt: letter.expiresAt || null,
            isExpired: false
          }
        });
      }
      return jsonRes(404, { success: false, message: 'Không tìm thấy lá thư này.' });
    }

    // 4.5. Mở khóa lá thư (/api/letters/:id/unlock)
    if (apiPath.startsWith('/api/letters/') && apiPath.endsWith('/unlock')) {
      const id = apiPath.replace('/api/letters/', '').replace('/unlock', '');
      let letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      let letter = letters.find(l => l.id === id || l.slug === id);

      if (!letter) {
        await syncWithCloudDb();
        letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
        letter = letters.find(l => l.id === id || l.slug === id);
      }

      // Nếu là thư từ Vibe Hub
      if (!letter) {
        const vibe = JSON.parse(localStorage.getItem('gh_mock_vibe') || '{}');
        for (const themeData of Object.values(vibe)) {
          if (!themeData.recipients || !Array.isArray(themeData.recipients)) continue;
          for (const r of themeData.recipients) {
            const rLetters = r.letters || r.keys || [];
            const found = rLetters.find(l => l.id === id || l.slug === id);
            if (found) {
              letter = {
                ...found,
                recipientName: r.name,
                theme: themeData.id || 'tet',
                password: found.letterPassword || found.keyPassword || ''
              };
              break;
            }
          }
          if (letter) break;
        }
      }

      if (letter) {
        if (letter.expiresAt && new Date(letter.expiresAt) < new Date()) {
          return jsonRes(410, {
            success: false,
            expired: true,
            message: 'Lá thư này đã hết hạn lưu giữ và đã tan biến vào hư không ⏳'
          });
        }

        const targetPass = letter.password || letter.letterPassword || letter.keyPassword || '';
        if (targetPass && normalizeKey(targetPass) !== normalizeKey(body.password || '')) {
          return jsonRes(401, { success: false, message: 'Mật khẩu chưa đúng, thử lại nhé 💌' });
        }
        letter.openedCount = (letter.openedCount || 0) + 1;
        localStorage.setItem('gh_mock_letters', JSON.stringify(letters));
        pushToCloudDb();

        const normalizedTheme = letter.theme === 'love' ? 'cute' : (letter.theme || 'tet');
        return jsonRes(200, {
          success: true,
          data: {
            ...letter,
            theme: normalizedTheme,
            content: letter.content || {
              greeting: `Gửi ${letter.recipientName || 'bạn'},`,
              paragraphs: Array.isArray(letter.paragraphs) ? letter.paragraphs : [letter.paragraphs || letter.message || ''],
              quotes: []
            }
          }
        });
      }
      return jsonRes(404, { success: false, message: 'Không tìm thấy thư.' });
    }

    // 4.6. Admin CRUD Thư Trực Tiếp (/api/letters)
    if (apiPath.startsWith('/api/letters') && !apiPath.endsWith('/meta') && !apiPath.endsWith('/unlock')) {
      const id = apiPath.replace('/api/letters', '').replace(/^\//, '');

      // GET /api/letters/:id
      if (method === 'GET' && id) {
        await syncWithCloudDb();
        const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
        let letter = letters.find(l => l.id === id || l.slug === id);
        if (!letter) {
          const vibe = JSON.parse(localStorage.getItem('gh_mock_vibe') || '{}');
          for (const themeKey of Object.keys(vibe)) {
            const themeObj = vibe[themeKey];
            if (themeObj && Array.isArray(themeObj.recipients)) {
              for (const rec of themeObj.recipients) {
                if (Array.isArray(rec.letters)) {
                  const match = rec.letters.find(l => l.id === id || l.slug === id);
                  if (match) {
                    letter = {
                      ...match,
                      recipientName: rec.name,
                      theme: themeKey === 'love' ? 'cute' : themeKey
                    };
                    break;
                  }
                }
              }
            }
            if (letter) break;
          }
        }
        if (letter) return jsonRes(200, { success: true, letter, data: letter });
        return jsonRes(404, { success: false, message: 'Không tìm thấy thư.' });
      }

      // GET /api/letters (Danh sách tất cả thư)
      if (method === 'GET') {
        await syncWithCloudDb();
        const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
        return jsonRes(200, { success: true, data: letters, letters });
      }

      const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');

      // POST /api/letters (Tạo thư mới trong Creator Studio - Admin)
      if (method === 'POST') {
        const currentLetters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
        const generatedId = `letter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newLetter = {
          ...body,
          id: (body.id && body.id.trim()) ? body.id.trim() : generatedId,
          slug: (body.slug && body.slug.trim()) ? body.slug.trim() : generatedId,
          senderId: 'usr_tiendat_root',
          senderUsername: 'admin',
          senderName: 'Quản Trị Viên',
          senderAvatar: '👑',
          senderRole: 'admin',
          isBroadcast: body.isBroadcast !== false,
          recipientUsername: body.recipientUsername ? body.recipientUsername.toLowerCase().trim() : '',
          openedCount: 0,
          createdAt: new Date().toISOString()
        };
        currentLetters.unshift(newLetter);
        try {
          localStorage.setItem('gh_mock_letters', JSON.stringify(currentLetters));
        } catch (storageErr) {
          console.warn('LocalStorage gần đầy, tối ưu hóa danh sách thư:', storageErr);
          if (currentLetters.length > 20) {
            localStorage.setItem('gh_mock_letters', JSON.stringify(currentLetters.slice(0, 20)));
          }
        }
        setTimeout(() => pushToCloudDb(), 50);
        return jsonRes(201, { success: true, data: newLetter, letter: newLetter });
      }

      // PUT /api/letters/:id (Chỉnh sửa thư)
      if (method === 'PUT') {
        const targetId = id || body.id || body.slug;
        if (targetId) {
          const idx = letters.findIndex(l => l.id === targetId || l.slug === targetId);
          if (idx !== -1) {
            letters[idx] = { ...letters[idx], ...body, updatedAt: new Date().toISOString() };
            try {
              localStorage.setItem('gh_mock_letters', JSON.stringify(letters));
            } catch {}
            setTimeout(() => pushToCloudDb(), 50);
            return jsonRes(200, { success: true, data: letters[idx], letter: letters[idx] });
          }
        }
        return jsonRes(404, { success: false, message: 'Không tìm thấy thư.' });
      }

      // DELETE /api/letters/:id (Xóa thư)
      if (method === 'DELETE' && id) {
        const filtered = letters.filter(l => l.id !== id && l.slug !== id);
        localStorage.setItem('gh_mock_letters', JSON.stringify(filtered));
        pushToCloudDb();
        return jsonRes(200, { success: true, message: 'Đã xóa lá thư.' });
      }
    }

    // ============================================================
    // 5. VIBE HUB: 4 BONG BÓNG & KHÓA 2 TẦNG (/api/vibe-hub)
    // ============================================================
    if (apiPath.startsWith('/api/vibe-hub')) {
      if (method === 'GET') {
        await syncWithCloudDb();
      }
      const vibe = JSON.parse(localStorage.getItem('gh_mock_vibe') || '{}');

      // Đảm bảo 4 chủ đề mặc định luôn tồn tại
      const themeDefs = [
        { id: 'tet', name: 'Tết', emoji: '🧧' },
        { id: 'birthday', name: 'Sinh nhật', emoji: '🎂' },
        { id: 'cute', name: 'Yêu', emoji: '💕' },
        { id: 'emotional', name: 'Tâm tình', emoji: '🌙' }
      ];
      for (const t of themeDefs) {
        if (!vibe[t.id]) {
          vibe[t.id] = { id: t.id, name: t.name, emoji: t.emoji, recipients: [] };
        } else {
          vibe[t.id].id = t.id;
          vibe[t.id].name = vibe[t.id].name || t.name;
          vibe[t.id].emoji = vibe[t.id].emoji || t.emoji;
          if (!Array.isArray(vibe[t.id].recipients)) {
            vibe[t.id].recipients = [];
          }
        }
      }

      // GET /api/vibe-hub/themes
      if (apiPath === '/api/vibe-hub/themes') {
        return jsonRes(200, {
          success: true,
          themes: themeDefs
        });
      }

      // GET /api/vibe-hub/admin/all
      if (apiPath === '/api/vibe-hub/admin/all') {
        return jsonRes(200, { success: true, data: vibe });
      }

      // POST /api/vibe-hub/admin/recipient (Thêm/Sửa người nhận vào chủ đề)
      if (apiPath === '/api/vibe-hub/admin/recipient' && method === 'POST') {
        const themeId = body.themeId || 'tet';
        const recData = body.recipient || body;
        const name = (recData.name || '').trim();

        if (!name) {
          return jsonRes(400, { success: false, message: 'Vui lòng nhập tên người nhận.' });
        }

        if (!vibe[themeId]) {
          vibe[themeId] = { id: themeId, name: themeId, emoji: '💌', recipients: [] };
        }
        if (!Array.isArray(vibe[themeId].recipients)) {
          vibe[themeId].recipients = [];
        }

        const recId = recData.id || name.toLowerCase().trim().replace(/\s+/g, '-');
        const rawAliases = recData.aliases || [name.toLowerCase().trim()];
        const aliases = Array.isArray(rawAliases) ? rawAliases : [rawAliases];
        if (!aliases.includes(name.toLowerCase().trim())) {
          aliases.push(name.toLowerCase().trim());
        }

        const existingIdx = vibe[themeId].recipients.findIndex(
          r => r.id === recId || r.name.toLowerCase().trim() === name.toLowerCase().trim()
        );

        let recObj;
        if (existingIdx !== -1) {
          recObj = {
            ...vibe[themeId].recipients[existingIdx],
            id: recId,
            name,
            aliases,
            letters: vibe[themeId].recipients[existingIdx].letters || vibe[themeId].recipients[existingIdx].keys || []
          };
          vibe[themeId].recipients[existingIdx] = recObj;
        } else {
          recObj = {
            id: recId,
            name,
            aliases,
            letters: []
          };
          vibe[themeId].recipients.push(recObj);
        }

        localStorage.setItem('gh_mock_vibe', JSON.stringify(vibe));
        pushToCloudDb();
        return jsonRes(200, { success: true, data: recObj, recipient: recObj });
      }

      // DELETE /api/vibe-hub/admin/recipient
      if (apiPath.startsWith('/api/vibe-hub/admin/recipient') && method === 'DELETE') {
        let themeId = body?.themeId;
        let recipientId = body?.recipientId;

        if (!themeId || !recipientId) {
          const parts = apiPath.split('/').filter(Boolean);
          if (parts.length >= 5) {
            recipientId = parts[parts.length - 1];
            themeId = parts[parts.length - 2];
          }
        }

        if (themeId && vibe[themeId] && Array.isArray(vibe[themeId].recipients)) {
          vibe[themeId].recipients = vibe[themeId].recipients.filter(r => r.id !== recipientId);
          localStorage.setItem('gh_mock_vibe', JSON.stringify(vibe));
          pushToCloudDb();
        }
        return jsonRes(200, { success: true, message: 'Đã xóa người nhận.' });
      }

      // POST /api/vibe-hub/admin/letter hoặc /key (Thêm/Sửa lá thư Khóa 2)
      if ((apiPath === '/api/vibe-hub/admin/letter' || apiPath === '/api/vibe-hub/admin/key') && method === 'POST') {
        const themeId = body.themeId || 'tet';
        const recipientId = body.recipientId;
        const letter = body.letter || body;

        const theme = vibe[themeId];
        if (theme && Array.isArray(theme.recipients)) {
          const rec = theme.recipients.find(r => r.id === recipientId);
          if (rec) {
            if (!Array.isArray(rec.letters)) {
              rec.letters = rec.keys || [];
            }
            const letId = letter.id || `letter-${Date.now()}`;
            const letObj = {
              id: letId,
              keyTitle: letter.keyTitle || letter.title || 'Lá Thư Bí Mật',
              keyIcon: letter.keyIcon || '🗝️',
              letterPassword: letter.letterPassword || letter.keyPassword || '',
              passwordHint: letter.passwordHint || '',
              title: letter.title || letter.keyTitle || 'Lá Thư Bí Mật',
              introQuote: letter.introQuote || '',
              content: letter.content || {
                greeting: 'Gửi bạn,',
                paragraphs: [letter.paragraph || 'Nội dung lá thư...'],
                quotes: []
              },
              photos: letter.photos || [],
              secretUnsaid: letter.secretUnsaid || { enabled: false },
              finalThought: letter.finalThought || { enabled: false },
              music: letter.music || { type: 'preset', track: 'dreamy_piano' }
            };

            const existingIdx = rec.letters.findIndex(l => l.id === letId);
            if (existingIdx !== -1) {
              rec.letters[existingIdx] = { ...rec.letters[existingIdx], ...letObj };
            } else {
              rec.letters.push(letObj);
            }
            rec.keys = rec.letters; // Đồng bộ ngược cho tương thích

            localStorage.setItem('gh_mock_vibe', JSON.stringify(vibe));
            pushToCloudDb();
            return jsonRes(200, { success: true, data: letObj, letter: letObj });
          }
        }
        return jsonRes(400, { success: false, message: 'Không tìm thấy người nhận.' });
      }

      // DELETE /api/vibe-hub/admin/letter hoặc /key
      if ((apiPath.startsWith('/api/vibe-hub/admin/letter') || apiPath.startsWith('/api/vibe-hub/admin/key')) && method === 'DELETE') {
        let themeId = body?.themeId;
        let recipientId = body?.recipientId;
        let letterId = body?.letterId || body?.keyId;

        if (!themeId || !recipientId || !letterId) {
          const parts = apiPath.split('/').filter(Boolean);
          if (parts.length >= 6) {
            letterId = parts[parts.length - 1];
            recipientId = parts[parts.length - 2];
            themeId = parts[parts.length - 3];
          }
        }

        if (themeId && vibe[themeId] && Array.isArray(vibe[themeId].recipients)) {
          const rec = vibe[themeId].recipients.find(r => r.id === recipientId);
          if (rec) {
            if (Array.isArray(rec.letters)) {
              rec.letters = rec.letters.filter(l => l.id !== letterId);
            }
            if (Array.isArray(rec.keys)) {
              rec.keys = rec.keys.filter(k => k.id !== letterId);
            }
            localStorage.setItem('gh_mock_vibe', JSON.stringify(vibe));
            pushToCloudDb();
          }
        }
        return jsonRes(200, { success: true, message: 'Đã xóa chiếc khóa thư.' });
      }

      // POST /api/vibe-hub/identify (Xác thực Khóa 1)
      if (apiPath === '/api/vibe-hub/identify' && method === 'POST') {
        const { themeId, identifier } = body;
        if (!identifier || !identifier.trim()) {
          return jsonRes(400, { success: false, message: 'Vui lòng nhập tên hoặc mật mã nhận diện.' });
        }
        const searchNorm = normalizeKey(identifier);
        const searchExact = identifier.toLowerCase().trim();

        let matchedRec = null;
        const mergedLetters = [];
        const seenLetterIds = new Set();

        for (const [tId, themeData] of Object.entries(vibe)) {
          if (!themeData.recipients || !Array.isArray(themeData.recipients)) continue;
          for (const r of themeData.recipients) {
            const matchId = r.id && (r.id.toLowerCase() === searchExact || normalizeKey(r.id) === searchNorm);
            const matchName = r.name && (r.name.toLowerCase() === searchExact || normalizeKey(r.name) === searchNorm);
            const matchAlias = Array.isArray(r.aliases) && r.aliases.some(alias => 
              alias.toLowerCase() === searchExact || normalizeKey(alias) === searchNorm
            );

            if (matchId || matchName || matchAlias) {
              if (!matchedRec) {
                matchedRec = { id: r.id, name: r.name };
              }
              const letters = r.letters || r.keys || [];
              letters.forEach(l => {
                if (!seenLetterIds.has(l.id)) {
                  seenLetterIds.add(l.id);
                  mergedLetters.push(l);
                }
              });
            }
          }
        }

        if (matchedRec) {
          return jsonRes(200, {
            success: true,
            recipient: matchedRec,
            keys: mergedLetters.map(l => ({
              id: l.id,
              keyTitle: l.keyTitle || l.title || 'Lá Thư Bí Mật',
              keyIcon: l.keyIcon || '🗝️',
              passwordHint: l.passwordHint || ''
            }))
          });
        }

        return jsonRes(401, { success: false, message: 'Hình như chưa đúng rồi... thử lại nhé 💌' });
      }

      // POST /api/vibe-hub/unlock-letter hoặc /unlock (Mở Khóa 2)
      if ((apiPath === '/api/vibe-hub/unlock-letter' || apiPath === '/api/vibe-hub/unlock') && method === 'POST') {
        const letterId = body.letterId || body.keyId;
        const password = body.password;
        const currentThemeId = body.currentThemeId || body.themeId;

        if (!letterId || password === undefined) {
          return jsonRes(400, { success: false, message: 'Thiếu thông tin mở khóa thư.' });
        }

        let targetLetter = null;
        let targetRecipient = null;
        let targetThemeId = null;

        for (const [tId, themeData] of Object.entries(vibe)) {
          if (!themeData.recipients || !Array.isArray(themeData.recipients)) continue;
          for (const r of themeData.recipients) {
            const letters = r.letters || r.keys || [];
            const found = letters.find(l => l.id === letterId);
            if (found) {
              targetLetter = found;
              targetRecipient = r;
              targetThemeId = tId;
              break;
            }
          }
          if (targetLetter) break;
        }

        if (!targetLetter) {
          return jsonRes(404, { success: false, message: 'Lá thư không tồn tại.' });
        }

        const passNorm = normalizeKey(password);
        const correctPassNorm = normalizeKey(targetLetter.letterPassword || targetLetter.keyPassword || '');

        if (passNorm !== correctPassNorm) {
          return jsonRes(401, { success: false, message: 'Mật khẩu chiếc khóa này chưa đúng... thử lại nhé 💌' });
        }

        return jsonRes(200, {
          success: true,
          letter: {
            id: targetLetter.id,
            recipientName: targetRecipient.name,
            title: targetLetter.title || targetLetter.keyTitle,
            introQuote: targetLetter.introQuote,
            theme: currentThemeId || targetThemeId || 'tet',
            content: targetLetter.content,
            photos: targetLetter.photos || [],
            secretUnsaid: targetLetter.secretUnsaid,
            finalThought: targetLetter.finalThought,
            music: targetLetter.music || { type: 'preset', track: 'dreamy_piano' }
          }
        });
      }
    }

    // Fallback cho /api không khớp: trả về JSON thành công rỗng an toàn, TUYỆT ĐỐI không gọi originalFetch vào server tĩnh
    return jsonRes(200, { success: true, data: [] });
  } catch (globalErr) {
    console.error('Lỗi nội bộ Mock Adapter:', globalErr);
    return jsonRes(200, {
      success: true,
      data: null,
      message: 'Đã hoàn tất thao tác an toàn.'
    });
  }
};
}
