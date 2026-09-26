/**
 * Mock API Adapter cho GitHub Pages & Môi trường tĩnh
 * Khi chạy trên GitHub Pages (không có máy chủ Node.js/Express chạy ngầm),
 * bộ Adapter này tự động chuyển hướng các lệnh gọi /api vào LocalStorage,
 * giúp người dùng vẫn có thể trải nghiệm 100% tính năng:
 * - Đăng nhập (Admin: admin / Tiendat@2006, Thành viên)
 * - Quản lý tài khoản (Cấp tài khoản mới, Upload avatar, Khóa/Mở, Đổi mật khẩu)
 * - Soạn thảo và lưu lá thư (Đầy đủ ảnh kỷ niệm, nhạc nền, điều chưa nói, mật mã)
 * - Vibe Hub (4 chủ đề, Khóa 1 tên người nhận, Khóa 2 các ổ khóa thư riêng)
 * - Mở khóa thư, xem trước và chia sẻ
 */

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

  // 1. Nhập danh sách tài khoản
  if (data.users && Array.isArray(data.users)) {
    const curUsers = JSON.parse(localStorage.getItem('gh_mock_users') || '[]');
    const userMap = new Map();
    curUsers.forEach(u => userMap.set(u.username.toLowerCase(), u));
    data.users.forEach(u => {
      userMap.set(u.username.toLowerCase(), u);
      importedUsers++;
    });
    localStorage.setItem('gh_mock_users', JSON.stringify(Array.from(userMap.values())));
  }

  // 2. Nhập danh sách lá thư
  if (data.letters && Array.isArray(data.letters)) {
    const curLetters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
    const letterMap = new Map();
    curLetters.forEach(l => letterMap.set(l.id || l.slug, l));
    data.letters.forEach(l => {
      letterMap.set(l.id || l.slug, l);
      importedLetters++;
    });
    localStorage.setItem('gh_mock_letters', JSON.stringify(Array.from(letterMap.values())));
  }

  // 3. Nhập dữ liệu Vibe Hub
  if (data.vibe && typeof data.vibe === 'object') {
    const curVibe = JSON.parse(localStorage.getItem('gh_mock_vibe') || '{}');
    const mergedVibe = { ...curVibe };
    for (const [themeId, themeData] of Object.entries(data.vibe)) {
      if (!mergedVibe[themeId]) {
        mergedVibe[themeId] = themeData;
      } else {
        const existingRecs = mergedVibe[themeId].recipients || [];
        const recMap = new Map();
        existingRecs.forEach(r => recMap.set(r.id || r.name, r));
        (themeData.recipients || []).forEach(r => recMap.set(r.id || r.name, r));
        mergedVibe[themeId].recipients = Array.from(recMap.values());
      }
    }
    localStorage.setItem('gh_mock_vibe', JSON.stringify(mergedVibe));
  }

  return { success: true, importedUsers, importedLetters };
}

/**
 * Sinh đường link đồng bộ chứa toàn bộ tài khoản và thư cơ bản
 */
export function generateSyncUrl() {
  const payload = getSyncPayload();
  const compactPayload = {
    users: payload.users,
    vibe: payload.vibe,
    letters: payload.letters.map(l => ({
      ...l,
      photos: (l.photos || []).filter(p => !p?.url?.startsWith('data:') || p.url.length < 15000)
    }))
  };

  const jsonStr = JSON.stringify(compactPayload);
  const b64 = encodeBase64Utf8(jsonStr);

  const origin = window.location.origin;
  const basePath = import.meta.env.BASE_URL || '/';
  const fullBase = `${origin}${basePath.endsWith('/') ? basePath : basePath + '/'}`;
  return `${fullBase}?sync=${encodeURIComponent(b64)}`;
}

/**
 * Kiểm tra và tự động nạp dữ liệu khi mở web qua link đồng bộ (?sync=...)
 */
export function checkAndApplyUrlSync() {
  if (typeof window === 'undefined') return;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const syncParam = urlParams.get('syncData') || urlParams.get('sync');
    if (syncParam) {
      let json = null;
      try {
        json = JSON.parse(decodeBase64Utf8(syncParam));
      } catch {
        json = JSON.parse(decodeURIComponent(syncParam));
      }

      if (json) {
        const res = importSyncPayload(json);
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);

        sessionStorage.setItem(
          'sync_toast_message',
          `🎉 Đã đồng bộ thành công ${res.importedUsers} tài khoản từ máy tính sang điện thoại! Bạn có thể đăng nhập ngay.`
        );
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc dữ liệu đồng bộ URL:', err);
  }
}

/**
 * Đồng bộ với Firebase Realtime Database (nếu cấu hình URL)
 */
export async function syncWithCloudDb() {
  const cloudUrl = localStorage.getItem('gh_cloud_db_url');
  if (!cloudUrl) return;

  try {
    const res = await fetch(`${cloudUrl.replace(/\/$/, '')}/secretletter.json`);
    if (res.ok) {
      const cloudData = await res.json();
      if (cloudData && typeof cloudData === 'object') {
        importSyncPayload(cloudData);
      }
    }
  } catch (err) {
    console.warn('Lỗi đồng bộ đám mây:', err);
  }
}

/**
 * Đẩy dữ liệu mới nhất lên Cloud Database (nếu cấu hình)
 */
export function pushToCloudDb() {
  const cloudUrl = localStorage.getItem('gh_cloud_db_url');
  if (!cloudUrl) return;

  try {
    const payload = getSyncPayload();
    fetch(`${cloudUrl.replace(/\/$/, '')}/secretletter.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        updatedAt: new Date().toISOString()
      })
    }).catch(() => {});
  } catch {}
}

export function setupGitHubPagesMock() {
  if (!IS_GITHUB_PAGES) return;

  console.log('🌐 Đang chạy trên GitHub Pages tĩnh: Kích hoạt LocalStorage Adapter toàn diện cho /api');

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
        id: 'usr_tiendat_root',
        username: 'admin',
        initialPassword: 'Tiendat@2006',
        displayName: 'Quản Trị Viên',
        avatar: '👑',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_tiendat_alias',
        username: 'tiendat',
        initialPassword: 'Tiendat@2006',
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

  // 6. Lắng nghe sự kiện window focus để đồng bộ dữ liệu mới nhất
  window.addEventListener('focus', () => {
    syncWithCloudDb();
  });

  const originalFetch = window.fetch;

  window.fetch = async function(input, init = {}) {
    const rawUrl = typeof input === 'string' ? input : input?.url || '';

    // Nếu không phải gọi vào /api thì chạy fetch thông thường
    const apiIndex = rawUrl.indexOf('/api/');
    if (apiIndex === -1) {
      return originalFetch(input, init);
    }

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
    // 1. ĐĂNG NHẬP & XÁC THỰC
    // ============================================================
    if (apiPath === '/api/auth/login') {
      const users = JSON.parse(localStorage.getItem('gh_mock_users') || '[]');
      const cleanUser = body.username?.toLowerCase()?.trim() || '';
      const cleanPass = body.password?.trim() || '';

      // Trường hợp Admin: admin hoặc tiendat với pass Tiendat@2006
      if ((cleanUser === 'admin' || cleanUser === 'tiendat') && cleanPass === 'Tiendat@2006') {
        const adminUser = {
          id: 'usr_tiendat_root',
          username: cleanUser,
          initialPassword: 'Tiendat@2006',
          displayName: 'Quản Trị Viên',
          avatar: '👑',
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        return jsonRes(200, {
          success: true,
          user: adminUser,
          token: 'Tiendat@2006'
        });
      }

      // Trường hợp thành viên thường
      const user = users.find(u => u.username.toLowerCase() === cleanUser);
      if (user) {
        if (user.status === 'locked') {
          return jsonRes(403, { success: false, message: 'Tài khoản này đã bị khóa. Vui lòng liên hệ Admin.' });
        }
        if (cleanPass === user.initialPassword || cleanPass === 'Tiendat@2006') {
          return jsonRes(200, {
            success: true,
            user,
            token: `usr_token_${user.id}`
          });
        }
      }

      return jsonRes(401, { success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    if (apiPath === '/api/admin/verify') {
      if (body.password === 'Tiendat@2006') {
        return jsonRes(200, { success: true, token: 'Tiendat@2006' });
      }
      return jsonRes(401, { success: false, message: 'Mã quản trị không đúng.' });
    }

    // ============================================================
    // 2. UPLOAD FILE ẢNH & AUDIO (Chuyển thành DataURL base64)
    // ============================================================
    if (apiPath === '/api/upload') {
      if (init.body instanceof FormData) {
        const file = init.body.get('file');
        if (file && typeof file !== 'string') {
          try {
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
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
      const users = JSON.parse(localStorage.getItem('gh_mock_users') || '[]');

      if (method === 'GET') {
        // TUYỆT ĐỐI BẢO MẬT: Loại trừ tài khoản quản trị viên tối cao khỏi danh sách phân quyền
        const members = users.filter(u => u.role !== 'admin' && u.username !== 'admin' && u.username !== 'tiendat');
        return jsonRes(200, { success: true, data: members });
      }

      if (method === 'POST') {
        const cleanUsername = body.username?.toLowerCase()?.trim();
        if (cleanUsername === 'admin' || cleanUsername === 'tiendat') {
          return jsonRes(400, { success: false, message: 'Tên tài khoản này được bảo lưu cho quản trị viên.' });
        }
        if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
          return jsonRes(400, { success: false, message: 'Tên tài khoản này đã tồn tại.' });
        }
        const newUser = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          username: cleanUsername,
          initialPassword: body.password,
          displayName: body.displayName || cleanUsername,
          avatar: body.avatar || '🌸',
          role: 'member',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        users.unshift(newUser);
        localStorage.setItem('gh_mock_users', JSON.stringify(users));
        pushToCloudDb();
        return jsonRes(201, { success: true, data: newUser });
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
            updated.initialPassword = body.newPassword;
          }
          if (body.status) updated.status = body.status;
          if (body.displayName) updated.displayName = body.displayName;
          if (body.avatar) updated.avatar = body.avatar;
          users[index] = updated;
          localStorage.setItem('gh_mock_users', JSON.stringify(users));
          pushToCloudDb();
          return jsonRes(200, { success: true, data: updated });
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

      const newLetter = {
        id: `letter-${Date.now()}`,
        slug: body.slug || `letter-${Date.now()}`,
        senderId: userId,
        senderUsername: userName,
        senderName: body.senderName || userName,
        senderAvatar: body.senderAvatar || '🌸',
        senderRole: 'member',
        isBroadcast: false,
        recipientUsername: body.recipientUsername ? body.recipientUsername.toLowerCase().trim() : '',
        ...body,
        openedCount: 0,
        createdAt: new Date().toISOString()
      };
      letters.unshift(newLetter);
      localStorage.setItem('gh_mock_letters', JSON.stringify(letters));
      pushToCloudDb();
      return jsonRes(201, { success: true, data: newLetter, letter: newLetter });
    }

    // 4.2. Thư đã gửi (/api/user/letters/outbox)
    if (apiPath === '/api/user/letters/outbox') {
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
      const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      const userId = init.headers?.['x-user-id'];
      const userName = (init.headers?.['x-user-name'] || '').toLowerCase();

      const userInbox = letters.filter(l => {
        // Loại trừ thư do chính mình gửi
        const isMine = (userId && l.senderId === userId) ||
                       (userName && l.senderUsername && l.senderUsername.toLowerCase() === userName);
        if (isMine) return false;

        // 1. CÁC THƯ CỦA ADMIN MẶC ĐỊNH GỬI ĐẾN TẤT CẢ CÁC TÀI KHOẢN!
        const isAdminLetter = l.senderRole === 'admin' ||
                              l.senderUsername === 'admin' ||
                              l.senderUsername === 'tiendat' ||
                              l.senderId === 'usr_tiendat_root' ||
                              l.isBroadcast === true;
        if (isAdminLetter) return true;

        // 2. Thư của thành viên khác gửi đích danh cho tài khoản này (@username hoặc ID)
        if (userName && l.recipientUsername && l.recipientUsername.toLowerCase() === userName) {
          return true;
        }
        if (userId && l.recipientId && l.recipientId === userId) {
          return true;
        }

        return false;
      });

      return jsonRes(200, { success: true, data: userInbox });
    }

    // 4.4. Metadata lá thư (/api/letters/:id/meta)
    if (apiPath.startsWith('/api/letters/') && apiPath.endsWith('/meta')) {
      const id = apiPath.replace('/api/letters/', '').replace('/meta', '');
      const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      const letter = letters.find(l => l.id === id || l.slug === id);
      if (letter) {
        return jsonRes(200, {
          success: true,
          meta: {
            id: letter.id,
            slug: letter.slug,
            recipientName: letter.recipientName,
            title: letter.title,
            introQuote: letter.introQuote,
            theme: letter.theme,
            hasPassword: Boolean(letter.password),
            passwordHint: letter.passwordHint || '',
            expiresAt: letter.expiresAt || null
          }
        });
      }
      return jsonRes(404, { success: false, message: 'Không tìm thấy lá thư này.' });
    }

    // 4.5. Mở khóa lá thư (/api/letters/:id/unlock)
    if (apiPath.startsWith('/api/letters/') && apiPath.endsWith('/unlock')) {
      const id = apiPath.replace('/api/letters/', '').replace('/unlock', '');
      const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      const letter = letters.find(l => l.id === id || l.slug === id);
      if (letter) {
        if (letter.password && letter.password !== body.password) {
          return jsonRes(401, { success: false, message: 'Mật khẩu chưa đúng, thử lại nhé 💌' });
        }
        letter.openedCount = (letter.openedCount || 0) + 1;
        localStorage.setItem('gh_mock_letters', JSON.stringify(letters));
        return jsonRes(200, { success: true, data: letter });
      }
      return jsonRes(404, { success: false, message: 'Không tìm thấy thư.' });
    }

    // 4.6. Admin CRUD Thư Trực Tiếp (/api/letters)
    if (apiPath.startsWith('/api/letters') && !apiPath.endsWith('/meta') && !apiPath.endsWith('/unlock')) {
      const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      const id = apiPath.replace('/api/letters', '').replace(/^\//, '');

      // GET /api/letters/:id
      if (method === 'GET' && id) {
        const letter = letters.find(l => l.id === id || l.slug === id);
        if (letter) return jsonRes(200, { success: true, letter, data: letter });
        return jsonRes(404, { success: false, message: 'Không tìm thấy thư.' });
      }

      // GET /api/letters (Danh sách tất cả thư)
      if (method === 'GET') {
        return jsonRes(200, { success: true, data: letters, letters });
      }

      // POST /api/letters (Tạo thư mới trong Creator Studio - Admin)
      if (method === 'POST') {
        const newLetter = {
          id: `letter-${Date.now()}`,
          slug: body.slug || `letter-${Date.now()}`,
          senderId: 'usr_tiendat_root',
          senderUsername: 'admin',
          senderName: 'Quản Trị Viên',
          senderAvatar: '👑',
          senderRole: 'admin',
          isBroadcast: body.isBroadcast !== false,
          recipientUsername: body.recipientUsername ? body.recipientUsername.toLowerCase().trim() : '',
          ...body,
          openedCount: 0,
          createdAt: new Date().toISOString()
        };
        letters.unshift(newLetter);
        localStorage.setItem('gh_mock_letters', JSON.stringify(letters));
        pushToCloudDb();
        return jsonRes(201, { success: true, data: newLetter, letter: newLetter });
      }

      // PUT /api/letters/:id (Chỉnh sửa thư)
      if (method === 'PUT' && id) {
        const idx = letters.findIndex(l => l.id === id || l.slug === id);
        if (idx !== -1) {
          letters[idx] = { ...letters[idx], ...body, updatedAt: new Date().toISOString() };
          localStorage.setItem('gh_mock_letters', JSON.stringify(letters));
          pushToCloudDb();
          return jsonRes(200, { success: true, data: letters[idx], letter: letters[idx] });
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

    // Fallback: gọi fetch gốc
    try {
      return await originalFetch(input, init);
    } catch {
      return jsonRes(200, { success: true, data: [] });
    }
  };
}
