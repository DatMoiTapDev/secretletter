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

export function setupGitHubPagesMock() {
  if (!IS_GITHUB_PAGES) return;

  console.log('🌐 Đang chạy trên GitHub Pages tĩnh: Kích hoạt LocalStorage Adapter toàn diện cho /api');

  // 1. Khởi tạo danh sách người dùng mẫu nếu chưa có
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

  // 2. Khởi tạo danh sách thư nếu chưa có
  if (!localStorage.getItem('gh_mock_letters')) {
    localStorage.setItem('gh_mock_letters', JSON.stringify([]));
  }

  // 3. Khởi tạo dữ liệu Vibe Hub nếu chưa có
  if (!localStorage.getItem('gh_mock_vibe')) {
    localStorage.setItem('gh_mock_vibe', JSON.stringify({
      tet: { id: 'tet', name: 'Tết', emoji: '🧧', recipients: [] },
      birthday: { id: 'birthday', name: 'Sinh nhật', emoji: '🎂', recipients: [] },
      cute: { id: 'cute', name: 'Yêu', emoji: '💕', recipients: [] },
      emotional: { id: 'emotional', name: 'Tâm tình', emoji: '🌙', recipients: [] }
    }));
  }

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
        return jsonRes(200, { success: true, data: users });
      }

      if (method === 'POST') {
        const cleanUsername = body.username?.toLowerCase()?.trim();
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
        return jsonRes(201, { success: true, data: newUser });
      }

      if (method === 'PUT') {
        const id = apiPath.split('/').pop();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
          const updated = { ...users[index] };
          if (body.newPassword) {
            updated.initialPassword = body.newPassword;
          }
          if (body.status) updated.status = body.status;
          if (body.displayName) updated.displayName = body.displayName;
          if (body.avatar) updated.avatar = body.avatar;
          users[index] = updated;
          localStorage.setItem('gh_mock_users', JSON.stringify(users));
          return jsonRes(200, { success: true, data: updated });
        }
        return jsonRes(404, { success: false, message: 'Không tìm thấy tài khoản.' });
      }

      if (method === 'DELETE') {
        const id = apiPath.split('/').pop();
        const filtered = users.filter(u => u.id !== id);
        localStorage.setItem('gh_mock_users', JSON.stringify(filtered));
        return jsonRes(200, { success: true, message: 'Đã xóa tài khoản.' });
      }
    }

    // ============================================================
    // 4. QUẢN LÝ LÁ THƯ (/api/letters & /api/user/letters)
    // ============================================================
    // 4.1. Soạn thư thành viên (/api/user/letters/compose)
    if (apiPath === '/api/user/letters/compose') {
      const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      const newLetter = {
        id: `letter-${Date.now()}`,
        slug: `letter-${Date.now()}`,
        senderId: init.headers?.['x-user-id'] || 'usr_tiendat_root',
        senderUsername: 'member',
        senderName: body.recipientName || 'Người gửi',
        ...body,
        openedCount: 0,
        createdAt: new Date().toISOString()
      };
      letters.unshift(newLetter);
      localStorage.setItem('gh_mock_letters', JSON.stringify(letters));
      return jsonRes(201, { success: true, data: newLetter });
    }

    // 4.2. Thư đã gửi (/api/user/letters/outbox)
    if (apiPath === '/api/user/letters/outbox') {
      const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      const userId = init.headers?.['x-user-id'];
      const userLetters = userId
        ? letters.filter(l => l.senderId === userId || !l.senderId)
        : letters;
      return jsonRes(200, { success: true, data: userLetters });
    }

    // 4.3. Thư nhận được (/api/user/letters/inbox)
    if (apiPath === '/api/user/letters/inbox') {
      return jsonRes(200, { success: true, data: [] });
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

      // POST /api/letters (Tạo thư mới trong Creator Studio)
      if (method === 'POST') {
        const newLetter = {
          id: `letter-${Date.now()}`,
          slug: body.slug || `letter-${Date.now()}`,
          ...body,
          openedCount: 0,
          createdAt: new Date().toISOString()
        };
        letters.unshift(newLetter);
        localStorage.setItem('gh_mock_letters', JSON.stringify(letters));
        return jsonRes(201, { success: true, data: newLetter, letter: newLetter });
      }

      // PUT /api/letters/:id (Chỉnh sửa thư)
      if (method === 'PUT' && id) {
        const idx = letters.findIndex(l => l.id === id || l.slug === id);
        if (idx !== -1) {
          letters[idx] = { ...letters[idx], ...body, updatedAt: new Date().toISOString() };
          localStorage.setItem('gh_mock_letters', JSON.stringify(letters));
          return jsonRes(200, { success: true, data: letters[idx], letter: letters[idx] });
        }
        return jsonRes(404, { success: false, message: 'Không tìm thấy thư.' });
      }

      // DELETE /api/letters/:id (Xóa thư)
      if (method === 'DELETE' && id) {
        const filtered = letters.filter(l => l.id !== id && l.slug !== id);
        localStorage.setItem('gh_mock_letters', JSON.stringify(filtered));
        return jsonRes(200, { success: true, message: 'Đã xóa lá thư.' });
      }
    }

    // ============================================================
    // 5. VIBE HUB: 4 BONG BÓNG & KHÓA 2 TẦNG (/api/vibe-hub)
    // ============================================================
    if (apiPath.startsWith('/api/vibe-hub')) {
      const vibe = JSON.parse(localStorage.getItem('gh_mock_vibe') || '{}');

      // GET /api/vibe-hub/themes
      if (apiPath === '/api/vibe-hub/themes') {
        return jsonRes(200, {
          success: true,
          themes: [
            { id: 'tet', name: 'Tết', emoji: '🧧' },
            { id: 'birthday', name: 'Sinh nhật', emoji: '🎂' },
            { id: 'cute', name: 'Yêu', emoji: '💕' },
            { id: 'emotional', name: 'Tâm tình', emoji: '🌙' }
          ]
        });
      }

      // GET /api/vibe-hub/admin/all
      if (apiPath === '/api/vibe-hub/admin/all') {
        return jsonRes(200, { success: true, data: vibe });
      }

      // POST /api/vibe-hub/admin/recipient (Thêm người nhận vào chủ đề)
      if (apiPath === '/api/vibe-hub/admin/recipient' && method === 'POST') {
        const { themeId, name, note } = body;
        if (!vibe[themeId]) vibe[themeId] = { id: themeId, recipients: [] };
        const newRec = {
          id: `rec_${Date.now()}`,
          name: name.trim(),
          note: note || '',
          keys: []
        };
        vibe[themeId].recipients.push(newRec);
        localStorage.setItem('gh_mock_vibe', JSON.stringify(vibe));
        return jsonRes(201, { success: true, data: newRec });
      }

      // DELETE /api/vibe-hub/admin/recipient/:themeId/:recId
      if (apiPath.startsWith('/api/vibe-hub/admin/recipient/') && method === 'DELETE') {
        const parts = apiPath.split('/');
        const recId = parts.pop();
        const themeId = parts.pop();
        if (vibe[themeId]) {
          vibe[themeId].recipients = vibe[themeId].recipients.filter(r => r.id !== recId);
          localStorage.setItem('gh_mock_vibe', JSON.stringify(vibe));
        }
        return jsonRes(200, { success: true, message: 'Đã xóa người nhận.' });
      }

      // POST /api/vibe-hub/admin/key (Thêm chiếc khóa 2 cho người nhận)
      if (apiPath === '/api/vibe-hub/admin/key' && method === 'POST') {
        const { themeId, recipientId, keyTitle, keyPassword, passwordHint, keyIcon, letterData } = body;
        const theme = vibe[themeId];
        if (theme) {
          const rec = theme.recipients.find(r => r.id === recipientId);
          if (rec) {
            const newKey = {
              id: `key_${Date.now()}`,
              keyTitle: keyTitle || 'Lá Thư Bí Mật',
              keyPassword: keyPassword || '',
              passwordHint: passwordHint || '',
              keyIcon: keyIcon || '🗝️',
              letterData: letterData || {}
            };
            rec.keys.push(newKey);
            localStorage.setItem('gh_mock_vibe', JSON.stringify(vibe));
            return jsonRes(201, { success: true, data: newKey });
          }
        }
        return jsonRes(400, { success: false, message: 'Không tìm thấy người nhận.' });
      }

      // DELETE /api/vibe-hub/admin/key/:themeId/:recId/:keyId
      if (apiPath.startsWith('/api/vibe-hub/admin/key/') && method === 'DELETE') {
        const parts = apiPath.split('/');
        const keyId = parts.pop();
        const recId = parts.pop();
        const themeId = parts.pop();
        if (vibe[themeId]) {
          const rec = vibe[themeId].recipients.find(r => r.id === recId);
          if (rec) {
            rec.keys = rec.keys.filter(k => k.id !== keyId);
            localStorage.setItem('gh_mock_vibe', JSON.stringify(vibe));
          }
        }
        return jsonRes(200, { success: true, message: 'Đã xóa chiếc khóa.' });
      }

      // POST /api/vibe-hub/identify (Xác thực Khóa 1)
      if (apiPath === '/api/vibe-hub/identify' && method === 'POST') {
        const { themeId, identifier } = body;
        const theme = vibe[themeId];
        if (theme && theme.recipients) {
          const clean = identifier?.toLowerCase()?.trim() || '';
          const rec = theme.recipients.find(r => r.name.toLowerCase().trim() === clean);
          if (rec) {
            return jsonRes(200, {
              success: true,
              recipient: { id: rec.id, name: rec.name },
              keys: (rec.keys || []).map(k => ({
                id: k.id,
                keyTitle: k.keyTitle,
                keyIcon: k.keyIcon,
                passwordHint: k.passwordHint
              }))
            });
          }
        }
        return jsonRes(404, { success: false, message: 'Chưa tìm thấy hòm thư với tên này... thử lại nhé 💌' });
      }

      // POST /api/vibe-hub/unlock (Mở Khóa 2)
      if (apiPath === '/api/vibe-hub/unlock' && method === 'POST') {
        const { themeId, recipientId, keyId, password } = body;
        const theme = vibe[themeId];
        if (theme && theme.recipients) {
          const rec = theme.recipients.find(r => r.id === recipientId);
          if (rec) {
            const key = (rec.keys || []).find(k => k.id === keyId);
            if (key) {
              if (key.keyPassword && key.keyPassword.trim() !== password?.trim()) {
                return jsonRes(401, { success: false, message: 'Mật khẩu chiếc khóa này chưa đúng 💌' });
              }
              return jsonRes(200, {
                success: true,
                letter: key.letterData || {}
              });
            }
          }
        }
        return jsonRes(404, { success: false, message: 'Không tìm thấy chiếc khóa này.' });
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
