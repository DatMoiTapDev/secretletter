/**
 * Mock API Adapter cho GitHub Pages
 * Khi chạy trên GitHub Pages (không có máy chủ Node.js/Express chạy ngầm),
 * bộ Adapter này tự động chuyển hướng các lệnh gọi /api vào LocalStorage,
 * giúp người dùng vẫn có thể thử nghiệm 100% tính năng (Đăng nhập, Soạn thư, Đọc thư, Quản trị).
 */

const IS_GITHUB_PAGES = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.protocol === 'file:'
);

export function setupGitHubPagesMock() {
  if (!IS_GITHUB_PAGES) return;

  console.log('🌐 Đang chạy trên GitHub Pages tĩnh: Kích hoạt LocalStorage Adapter cho /api');

  // Khởi tạo dữ liệu mẫu nếu LocalStorage trống
  if (!localStorage.getItem('gh_mock_users')) {
    const initialUsers = [
      {
        id: 'usr_tiendat_root',
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

  if (!localStorage.getItem('gh_mock_letters')) {
    localStorage.setItem('gh_mock_letters', JSON.stringify([]));
  }

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
    const url = typeof input === 'string' ? input : input?.url || '';

    // Nếu không phải gọi vào /api thì chạy fetch thông thường
    if (!url.includes('/api/')) {
      return originalFetch(input, init);
    }

    const method = (init.method || 'GET').toUpperCase();
    let body = {};
    if (init.body) {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = {};
      }
    }

    // Helper trả về JSON Response giả lập
    const jsonRes = (status, data) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    // 1. /api/auth/login
    if (url.includes('/api/auth/login')) {
      const users = JSON.parse(localStorage.getItem('gh_mock_users') || '[]');
      const user = users.find(u => u.username.toLowerCase() === body.username?.toLowerCase()?.trim());
      if (user && (body.password === user.initialPassword || body.password === 'Tiendat@2006')) {
        return jsonRes(200, {
          success: true,
          user,
          token: `mock_token_${user.id}`
        });
      }
      return jsonRes(401, { success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    // 2. /api/admin/verify
    if (url.includes('/api/admin/verify')) {
      if (body.password === 'Tiendat@2006') {
        return jsonRes(200, { success: true, token: 'Tiendat@2006' });
      }
      return jsonRes(401, { success: false, message: 'Mã quản trị không đúng.' });
    }

    // 3. /api/admin/users
    if (url.includes('/api/admin/users')) {
      const users = JSON.parse(localStorage.getItem('gh_mock_users') || '[]');
      if (method === 'GET') {
        return jsonRes(200, { success: true, data: users });
      }
      if (method === 'POST') {
        const newUser = {
          id: `usr_${Date.now()}`,
          username: body.username.toLowerCase().trim(),
          initialPassword: body.password,
          displayName: body.displayName || body.username,
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
        const id = url.split('/').pop();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
          users[index] = { ...users[index], ...body };
          localStorage.setItem('gh_mock_users', JSON.stringify(users));
          return jsonRes(200, { success: true, data: users[index] });
        }
      }
      if (method === 'DELETE') {
        const id = url.split('/').pop();
        const filtered = users.filter(u => u.id !== id);
        localStorage.setItem('gh_mock_users', JSON.stringify(filtered));
        return jsonRes(200, { success: true, message: 'Đã xóa' });
      }
    }

    // 4. /api/user/letters/compose
    if (url.includes('/api/user/letters/compose')) {
      const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      const newLetter = {
        id: `letter-${Date.now()}`,
        slug: `letter-${Date.now()}`,
        senderId: 'usr_tiendat_root',
        senderUsername: 'tiendat',
        senderName: 'Tiến Đạt',
        senderAvatar: '👑',
        ...body,
        openedCount: 0,
        createdAt: new Date().toISOString()
      };
      letters.unshift(newLetter);
      localStorage.setItem('gh_mock_letters', JSON.stringify(letters));
      return jsonRes(201, { success: true, data: newLetter });
    }

    // 5. /api/user/letters/outbox
    if (url.includes('/api/user/letters/outbox')) {
      const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      return jsonRes(200, { success: true, data: letters });
    }

    // 6. /api/user/letters/inbox
    if (url.includes('/api/user/letters/inbox')) {
      return jsonRes(200, { success: true, data: [] });
    }

    // 7. /api/letters/:id/meta
    if (url.includes('/api/letters/') && url.endsWith('/meta')) {
      const id = url.replace('/api/letters/', '').replace('/meta', '');
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
            passwordHint: letter.passwordHint || ''
          }
        });
      }
      return jsonRes(404, { success: false, message: 'Không tìm thấy thư.' });
    }

    // 8. /api/letters/:id/unlock
    if (url.includes('/api/letters/') && url.endsWith('/unlock')) {
      const id = url.replace('/api/letters/', '').replace('/unlock', '');
      const letters = JSON.parse(localStorage.getItem('gh_mock_letters') || '[]');
      const letter = letters.find(l => l.id === id || l.slug === id);
      if (letter) {
        if (letter.password && letter.password !== body.password) {
          return jsonRes(401, { success: false, message: 'Mật khẩu chưa đúng.' });
        }
        letter.openedCount = (letter.openedCount || 0) + 1;
        localStorage.setItem('gh_mock_letters', JSON.stringify(letters));
        return jsonRes(200, { success: true, data: letter });
      }
      return jsonRes(404, { success: false, message: 'Không tìm thấy thư.' });
    }

    // 9. /api/vibe-hub/themes
    if (url.includes('/api/vibe-hub/themes')) {
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

    // 10. /api/vibe-hub/theme/:id
    if (url.includes('/api/vibe-hub/theme/')) {
      const themeId = url.split('/').pop();
      const vibe = JSON.parse(localStorage.getItem('gh_mock_vibe') || '{}');
      return jsonRes(200, {
        success: true,
        data: vibe[themeId] || { id: themeId, recipients: [] }
      });
    }

    // 11. /api/vibe-hub/admin/all
    if (url.includes('/api/vibe-hub/admin/all')) {
      const vibe = JSON.parse(localStorage.getItem('gh_mock_vibe') || '{}');
      return jsonRes(200, { success: true, data: vibe });
    }

    // Fallback: gọi fetch gốc
    try {
      return await originalFetch(input, init);
    } catch {
      return jsonRes(200, { success: true, data: [] });
    }
  };
}
