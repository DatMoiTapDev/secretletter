import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Share2,
  Lock,
  Unlock,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Copy,
  Check,
  LogOut,
  FolderLock,
  KeyRound,
  Layers,
  UserCheck,
  Users,
  UserPlus,
  Key,
  RefreshCw,
  X,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  ArrowLeft,
  Upload
} from 'lucide-react';
import { THEMES, THEME_LIST } from '../types/theme';
import ShareModal from '../components/ShareModal';
import UserAvatar from '../components/UserAvatar';
import { soundEngine } from '../audio/soundEngine';
import { getAppUrl, copyToClipboard } from '../utils/url';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token') || '');
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Chế độ Nền Sáng / Nền Tối & Âm Lượng
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);

  const handleToggleDarkMode = () => {
    soundEngine.playClickSound();
    setIsDarkMode(prev => !prev);
  };

  const handleVolumeChange = (newVal) => {
    const v = parseFloat(newVal);
    setVolume(v);
    soundEngine.setVolume(v);
    if (v > 0 && isMuted) {
      soundEngine.toggleMute();
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Tab quản lý: 'vibeHub' | 'direct' | 'users'
  const [activeStudioTab, setActiveStudioTab] = useState('vibeHub');

  // State Thư Link Trực Tiếp
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedShareLetter, setSelectedShareLetter] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // State Vibe Hub
  const [vibeStore, setVibeStore] = useState({});
  const [selectedVibeTheme, setSelectedVibeTheme] = useState('tet');
  const [loadingVibe, setLoadingVibe] = useState(false);

  // Modal Thêm Người Nhận Vibe Hub (Khóa 1)
  const [recipientModalOpen, setRecipientModalOpen] = useState(false);
  const [recipientForm, setRecipientForm] = useState({ id: '', name: '', aliases: '' });

  // Modal Thêm Khóa / Thư Vibe Hub (Khóa 2)
  const [letterModalOpen, setLetterModalOpen] = useState(false);
  const [activeRecipientForLetter, setActiveRecipientForLetter] = useState(null);
  const [letterForm, setLetterForm] = useState({
    id: '',
    keyTitle: '',
    keyIcon: '🗝️',
    letterPassword: '',
    passwordHint: '',
    title: '',
    introQuote: '',
    greeting: 'Gửi bạn,',
    paragraphs: '',
    secretUnsaid: '',
    finalThought: ''
  });

  // State Quản Lý Thành Viên (Users)
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '', displayName: '', avatar: '🌸' });
  const [userError, setUserError] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [copiedPassId, setCopiedPassId] = useState(null);
  const [createdUserCreds, setCreatedUserCreds] = useState(null);
  const [copiedCreatedCreds, setCopiedCreatedCreds] = useState(false);

  // Xác thực mã quản trị
  const handleLogin = async (e) => {
    e.preventDefault();
    soundEngine.playClickSound();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passcode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        setAdminToken(data.token);
      } else {
        setAuthError(data.message || 'Mật khẩu quản trị không chính xác.');
      }
    } catch (err) {
      setAuthError('Lỗi kết nối máy chủ.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setAdminToken('');
  };

  // Tải danh sách thư trực tiếp
  const fetchLetters = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/letters', {
        headers: { 'x-admin-key': adminToken }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const result = await res.json();
      if (result.success) {
        setLetters(result.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách thư:', err);
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu toàn bộ Vibe Hub
  const fetchVibeStore = async () => {
    if (!adminToken) return;
    setLoadingVibe(true);
    try {
      const res = await fetch('/api/vibe-hub/admin/all', {
        headers: { 'x-admin-key': adminToken }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const result = await res.json();
      if (result.success) {
        setVibeStore(result.data || {});
      }
    } catch (err) {
      console.error('Lỗi tải Vibe Hub:', err);
    } finally {
      setLoadingVibe(false);
    }
  };

  // Tải danh sách tài khoản thành viên
  const fetchUsers = async () => {
    if (!adminToken) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-key': adminToken }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const result = await res.json();
      if (result.success) {
        // Chỉ hiển thị thành viên thường, không hiện tài khoản admin
        const memberOnly = (result.data || []).filter(
          (u) => u.role !== 'admin' && u.username !== 'admin' && u.username !== 'tiendat'
        );
        setUsers(memberOnly);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách thành viên:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchLetters();
      fetchVibeStore();
      fetchUsers();
    }
  }, [adminToken]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedShareLetter) setSelectedShareLetter(null);
        if (recipientModalOpen) setRecipientModalOpen(false);
        if (letterModalOpen) setLetterModalOpen(false);
        if (userModalOpen) setUserModalOpen(false);
        if (resetModalOpen) setResetModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShareLetter, recipientModalOpen, letterModalOpen, userModalOpen, resetModalOpen]);

  // Xóa lá thư link trực tiếp
  const handleDeleteLetter = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa lá thư gửi "${name}" không?`)) return;
    soundEngine.playClickSound();
    try {
      const res = await fetch(`/api/letters/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminToken }
      });
      if (res.ok) {
        setLetters(letters.filter((l) => l.id !== id && l.slug !== id));
      }
    } catch (err) {
      alert('Không thể xóa thư lúc này.');
    }
  };

  // Copy link nhanh
  const handleQuickCopyLink = (letter) => {
    soundEngine.playClickSound();
    const url = getAppUrl(`letter/${letter.slug || letter.id}`);
    navigator.clipboard.writeText(url);
    setCopiedId(letter.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // LƯU NGƯỜI NHẬN VIBE HUB (KHÓA 1)
  const handleSaveRecipient = async (e) => {
    e.preventDefault();
    if (!recipientForm.name.trim()) return;

    soundEngine.playClickSound();
    const aliases = recipientForm.aliases
      .split(',')
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);

    if (!aliases.includes(recipientForm.name.toLowerCase().trim())) {
      aliases.push(recipientForm.name.toLowerCase().trim());
    }

    try {
      const res = await fetch('/api/vibe-hub/admin/recipient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminToken
        },
        body: JSON.stringify({
          themeId: selectedVibeTheme,
          recipient: {
            id: recipientForm.id || recipientForm.name.toLowerCase().trim().replace(/\s+/g, '-'),
            name: recipientForm.name.trim(),
            aliases
          }
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        setRecipientModalOpen(false);
        setRecipientForm({ id: '', name: '', aliases: '' });
        fetchVibeStore();
      } else {
        alert(data.message || 'Lỗi khi lưu người nhận.');
      }
    } catch (err) {
      console.error('Error saving recipient:', err);
      alert('Lỗi khi lưu người nhận.');
    }
  };

  // XÓA NGƯỜI NHẬN VIBE HUB
  const handleDeleteVibeRecipient = async (recipientId, recipientName) => {
    if (!window.confirm(`Xóa người nhận "${recipientName}" và toàn bộ các khóa thư của người này?`)) return;
    soundEngine.playClickSound();
    try {
      const res = await fetch('/api/vibe-hub/admin/recipient', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminToken
        },
        body: JSON.stringify({
          themeId: selectedVibeTheme,
          recipientId
        })
      });
      if (res.ok) fetchVibeStore();
    } catch (err) {
      alert('Không thể xóa người nhận.');
    }
  };

  // LƯU LÁ THƯ / KHÓA 2 DƯỚI NGƯỜI NHẬN
  const handleSaveVibeLetter = async (e) => {
    e.preventDefault();
    if (!letterForm.keyTitle.trim() || !letterForm.letterPassword.trim()) {
      alert('Vui lòng nhập Tên chiếc khóa và Mật khẩu mở khóa.');
      return;
    }

    soundEngine.playClickSound();
    const paras = letterForm.paragraphs
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const letterPayload = {
      id: letterForm.id || `letter-${Date.now()}`,
      keyTitle: letterForm.keyTitle.trim(),
      keyIcon: letterForm.keyIcon || '🗝️',
      letterPassword: letterForm.letterPassword.trim(),
      passwordHint: letterForm.passwordHint.trim(),
      title: letterForm.title.trim() || letterForm.keyTitle.trim(),
      introQuote: letterForm.introQuote.trim() || 'Có một vài điều mình muốn bạn đọc thật chậm...',
      content: {
        greeting: letterForm.greeting.trim() || 'Gửi bạn,',
        paragraphs: paras.length > 0 ? paras : ['Nội dung lá thư dành riêng cho bạn...'],
        quotes: []
      },
      photos: [],
      secretUnsaid: {
        enabled: Boolean(letterForm.secretUnsaid.trim()),
        prompt: '💌 Có một điều mình chưa nói...',
        buttonText: 'Mở phần này',
        content: letterForm.secretUnsaid.trim()
      },
      finalThought: {
        enabled: Boolean(letterForm.finalThought.trim()),
        prompt: 'Còn một điều cuối cùng...',
        content: letterForm.finalThought.trim()
      },
      music: { type: 'preset', track: 'dreamy_piano' }
    };

    try {
      const res = await fetch('/api/vibe-hub/admin/letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminToken
        },
        body: JSON.stringify({
          themeId: selectedVibeTheme,
          recipientId: activeRecipientForLetter.id,
          letter: letterPayload
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        setLetterModalOpen(false);
        fetchVibeStore();
      } else {
        alert(data.message || 'Lỗi khi lưu lá thư.');
      }
    } catch (err) {
      console.error('Error saving vibe letter:', err);
      alert('Lỗi khi lưu lá thư.');
    }
  };

  // XÓA LÁ THƯ / KHÓA 2
  const handleDeleteVibeLetter = async (recipientId, letterId, keyTitle) => {
    if (!window.confirm(`Xóa chiếc khóa "${keyTitle}"?`)) return;
    soundEngine.playClickSound();
    try {
      const res = await fetch('/api/vibe-hub/admin/letter', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminToken
        },
        body: JSON.stringify({
          themeId: selectedVibeTheme,
          recipientId,
          letterId
        })
      });
      if (res.ok) fetchVibeStore();
    } catch (err) {
      alert('Không thể xóa lá thư.');
    }
  };

  // ================= TÁC VỤ QUẢN TRỊ TÀI KHOẢN =================
  // 1. Cấp tài khoản mới
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    if (!userForm.username.trim() || !userForm.password.trim()) {
      setUserError('Vui lòng điền đầy đủ tài khoản và mật khẩu.');
      return;
    }
    soundEngine.playClickSound();

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminToken
        },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const created = data.data || userForm;
        setUserModalOpen(false);
        setCreatedUserCreds({
          username: created.username,
          password: created.initialPassword || userForm.password,
          displayName: created.displayName || created.username,
          avatar: created.avatar || '🌸',
          loginUrl: getAppUrl('login')
        });
        setUserForm({ username: '', password: '', displayName: '', avatar: '🌸' });
        fetchUsers();
      } else {
        setUserError(data.message || 'Lỗi khi tạo tài khoản.');
      }
    } catch (err) {
      setUserError('Lỗi kết nối máy chủ.');
    }
  };

  // 2. Khóa / Mở khóa tài khoản
  const handleToggleUserStatus = async (user) => {
    soundEngine.playClickSound();
    const nextStatus = user.status === 'locked' ? 'active' : 'locked';
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminToken
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      alert('Không thể cập nhật trạng thái tài khoản.');
    }
  };

  // 3. Đặt lại mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPasswordInput.trim() || !resetTargetUser) return;
    soundEngine.playClickSound();

    try {
      const res = await fetch(`/api/admin/users/${resetTargetUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminToken
        },
        body: JSON.stringify({ newPassword: newPasswordInput.trim() })
      });
      if (res.ok) {
        setResetModalOpen(false);
        setResetTargetUser(null);
        setNewPasswordInput('');
        fetchUsers();
      }
    } catch (err) {
      alert('Lỗi khi đặt lại mật khẩu.');
    }
  };

  // 4. Xóa tài khoản
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.displayName || user.username}"?`)) return;
    soundEngine.playClickSound();
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminToken }
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      alert('Lỗi khi xóa tài khoản.');
    }
  };

  // 5. Copy thông tin đăng nhập cấp cho người dùng
  const handleCopyUserCreds = async (user) => {
    soundEngine.playClickSound();
    const text = `💌 Thông tin tài khoản gửi thư bí mật:\n- Trang web: ${getAppUrl('login')}\n- Tài khoản: ${user.username}\n- Mật khẩu: ${user.initialPassword || '(Đã đổi)'}`;
    await copyToClipboard(text);
    setCopiedPassId(user.id);
    setTimeout(() => setCopiedPassId(null), 2500);
  };

  // Helper classes cho Light/Dark mode thích ứng hài hòa
  const cardCls = isDarkMode
    ? 'bg-neutral-900/90 border-white/10 text-neutral-100 shadow-xl'
    : 'bg-white border-neutral-200/90 text-neutral-900 shadow-xs';
  const subCardCls = isDarkMode
    ? 'bg-neutral-800/80 border-white/5 text-neutral-200'
    : 'bg-stone-50 border-stone-200 text-stone-900';
  const inputCls = isDarkMode
    ? 'bg-neutral-800 border-white/10 text-white placeholder-neutral-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30'
    : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30';
  const labelCls = isDarkMode
    ? 'text-neutral-300 font-medium text-xs'
    : 'text-stone-700 font-medium text-xs';
  const modalBoxCls = isDarkMode
    ? 'bg-neutral-900 border-white/20 text-white'
    : 'bg-white border-neutral-200 text-neutral-900 shadow-2xl';

  // ================= MÀN HÌNH ĐĂNG NHẬP ADMIN BẢO MẬT =================
  if (!adminToken) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        isDarkMode ? 'bg-neutral-950 text-white' : 'bg-[#faf8f5] text-neutral-900'
      }`}>
        <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl text-center space-y-6 ${
          isDarkMode ? 'bg-neutral-900 border-white/15' : 'bg-white border-neutral-200'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
            <ShieldCheck size={34} />
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold mb-1">
              Quản Trị Viên (Creator Studio)
            </h2>
            <p className={`text-xs font-serif italic ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Khu vực bảo vệ quyền riêng tư - Cần mã truy cập quản trị tối cao
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className={labelCls}>Mã bí mật quản trị:</label>
              <input
                type="password"
                required
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Nhập mã quản trị hệ thống..."
                className={`w-full mt-1.5 px-4 py-3 rounded-xl text-sm outline-none transition-all ${inputCls}`}
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-500 font-medium">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all shadow-md cursor-pointer"
            >
              Vào Không Gian Quản Trị
            </button>
          </form>

          <div className={`pt-4 border-t text-[11px] flex items-center justify-between ${
            isDarkMode ? 'border-white/10 text-neutral-500' : 'border-neutral-200 text-neutral-500'
          }`}>
            <Link to="/" className="inline-flex items-center gap-1 hover:underline text-amber-600 dark:text-amber-400">
              <ArrowLeft size={13} />
              <span>Về trang chủ</span>
            </Link>
            <span>Bảo vệ quyền riêng tư 100%</span>
          </div>
        </div>
      </div>
    );
  }

  // Danh sách người nhận của chủ đề đang chọn trong Vibe Hub
  const currentThemeRecipients = vibeStore[selectedVibeTheme]?.recipients || [];

  return (
    <div className={`min-h-screen transition-colors duration-500 p-4 sm:p-8 ${
      isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#faf8f5] text-neutral-900'
    }`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER QUẢN TRỊ */}
        <header className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 transition-colors ${
          isDarkMode ? 'border-white/10' : 'border-neutral-200'
        }`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
              isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-800'
            }`}>
              <Sparkles size={14} />
              <span>Creator Studio Chính Thức</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-serif font-bold ${
              isDarkMode ? 'text-white' : 'text-neutral-900'
            }`}>
              Bảng Điều Khiển Những Lá Thư Bí Mật
            </h1>
            <p className={`text-xs sm:text-sm mt-1 ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
            }`}>
              Quản lý người nhận, cấp tài khoản thành viên gửi thư và kiểm soát toàn diện
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* TOUCH BUTTON CHUYỂN ĐỔI: NỀN SÁNG ☀️ / NỀN TỐI 🌙 */}
            <button
              type="button"
              onClick={handleToggleDarkMode}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-sans font-medium transition-all shadow-xs cursor-pointer ${
                isDarkMode
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-400/30'
                  : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 shadow-xs'
              }`}
              title={isDarkMode ? 'Chạm để chuyển sang Nền Sáng ☀️' : 'Chạm để chuyển sang Nền Tối 🌙'}
            >
              {isDarkMode ? (
                <>
                  <Moon size={14} className="text-sky-300" />
                  <span className="hidden xs:inline">Nền Tối</span>
                </>
              ) : (
                <>
                  <Sun size={14} className="text-amber-500" />
                  <span className="hidden xs:inline">Nền Sáng</span>
                </>
              )}
            </button>

            {/* BỘ ĐIỀU CHỈNH ÂM LƯỢNG */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleMute}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-white/10'
                    : 'bg-white hover:bg-neutral-100 text-amber-700 border border-neutral-300 shadow-xs'
                }`}
                title={isMuted ? 'Đang tắt âm thanh (Chạm để bật)' : 'Bật/Tắt âm thanh'}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${
                isDarkMode ? 'bg-neutral-900 border border-white/10' : 'bg-white border border-neutral-300 shadow-xs'
              }`}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  className="w-16 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                />
                <span className={`text-[10px] font-mono w-7 text-right ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            <Link
              to="/"
              target="_blank"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-serif transition-colors ${
                isDarkMode
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10'
                  : 'bg-white hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 border border-neutral-300 shadow-xs'
              }`}
            >
              <span>Trang chính</span>
              <ExternalLink size={13} />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDarkMode
                  ? 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white hover:bg-neutral-800'
                  : 'bg-white border-neutral-300 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* NÚT CHUYỂN ĐỔI 3 TAB QUẢN TRỊ */}
        <div className={`flex flex-wrap items-center gap-2 border-b pb-3 ${
          isDarkMode ? 'border-white/10' : 'border-neutral-200'
        }`}>
          {/* TAB 1: VIBE HUB */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClickSound();
              setActiveStudioTab('vibeHub');
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer ${
              activeStudioTab === 'vibeHub'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : isDarkMode
                  ? 'bg-neutral-900 text-neutral-400 hover:text-white'
                  : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200 shadow-xs'
            }`}
          >
            <Layers size={15} className="shrink-0" />
            <span className="hidden sm:inline">1. Vibe Hub (Bong Bóng & Khóa 2 Tầng)</span>
            <span className="sm:hidden">1. Vibe Hub</span>
          </button>

          {/* TAB 2: THƯ LINK TRỰC TIẾP */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClickSound();
              setActiveStudioTab('direct');
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer ${
              activeStudioTab === 'direct'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : isDarkMode
                  ? 'bg-neutral-900 text-neutral-400 hover:text-white'
                  : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200 shadow-xs'
            }`}
          >
            <Mail size={15} className="shrink-0" />
            <span className="hidden sm:inline">2. Thư Đường Link Riêng (/letter/:id)</span>
            <span className="sm:hidden">2. Thư Riêng</span>
          </button>

          {/* TAB 3: QUẢN TRỊ TÀI KHOẢN THÀNH VIÊN GỬI THƯ */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClickSound();
              setActiveStudioTab('users');
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer ${
              activeStudioTab === 'users'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : isDarkMode
                  ? 'bg-neutral-900 text-neutral-400 hover:text-white'
                  : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200 shadow-xs'
            }`}
          >
            <Users size={15} className="shrink-0" />
            <span className="hidden sm:inline">3. Quản Trị Tài Khoản Thành Viên ({users.length})</span>
            <span className="sm:hidden">3. Thành Viên ({users.length})</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: QUẢN LÝ VIBE HUB (BONG BÓNG & KHÓA 2 TẦNG)
            ======================================================== */}
        {activeStudioTab === 'vibeHub' && (
          <div className="space-y-6">
            
            {/* THANH CHỌN CHỦ ĐỀ VIBE HUB (4 CHỦ ĐỀ CỐT LÕI) */}
            <div className={`p-4 rounded-2xl border space-y-3 ${cardCls}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-serif font-bold ${
                  isDarkMode ? 'text-amber-300' : 'text-amber-800'
                }`}>
                  Chọn Chủ Đề Để Quản Lý Người Nhận & Khóa Thư:
                </span>
                <span className={`text-[11px] font-serif ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}>
                  4 Chủ đề cốt lõi
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {THEME_LIST.map((t) => {
                  const isCur = selectedVibeTheme === t.id;
                  const recCount = vibeStore[t.id]?.recipients?.length || 0;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playClickSound();
                        setSelectedVibeTheme(t.id);
                      }}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isCur
                          ? 'bg-amber-500/20 border-amber-500 text-amber-900 dark:text-white shadow-md scale-102 font-bold ring-1 ring-amber-400/50'
                          : isDarkMode
                            ? 'bg-neutral-800/60 border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-800'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                      }`}
                    >
                      <span className="text-2xl mb-1">{t.emoji}</span>
                      <span className="text-xs font-serif font-bold">{t.name}</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">({recCount} người nhận)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KHU VỰC QUẢN LÝ NGƯỜI NHẬN & KHÓA THƯ CỦA CHỦ ĐỀ NÀY */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className={`text-lg font-serif font-bold flex items-center gap-2 ${
                    isDarkMode ? 'text-white' : 'text-stone-900'
                  }`}>
                    <span>{THEMES[selectedVibeTheme]?.emoji}</span>
                    <span>Danh Sách Người Nhận Của Chủ Đề: {THEMES[selectedVibeTheme]?.name}</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-neutral-400' : 'text-stone-600'}`}>
                    Người nhận nhập đúng tên/mật mã ở Khóa 1 để mở các chiếc khóa thư riêng của mình
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClickSound();
                    setRecipientForm({ id: '', name: '', aliases: '' });
                    setRecipientModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus size={15} />
                  <span>Thêm Người Nhận Mới</span>
                </button>
              </div>

              {currentThemeRecipients.length === 0 ? (
                <div className={`p-10 rounded-2xl border border-dashed text-center ${
                  isDarkMode ? 'bg-neutral-900/40 border-white/10 text-neutral-400' : 'bg-white border-neutral-300 text-stone-500'
                }`}>
                  <UserCheck size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-serif font-medium">Chưa có người nhận nào trong chủ đề này.</p>
                  <p className="text-xs opacity-75 mt-1">Bấm nút "Thêm Người Nhận Mới" để tạo người nhận đầu tiên.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {currentThemeRecipients.map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-6 rounded-2xl border space-y-4 ${cardCls}`}
                    >
                      {/* HEADER NGƯỜI NHẬN */}
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
                        isDarkMode ? 'border-white/10' : 'border-neutral-200'
                      }`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-serif font-bold text-amber-700 dark:text-amber-300">
                              👤 {rec.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                              isDarkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                            }`}>
                              ID: {rec.id}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            Các từ khóa nhận diện hợp lệ (Khóa 1):{' '}
                            <strong className={`font-mono ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                              {(rec.aliases || [rec.name]).join(', ')}
                            </strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playClickSound();
                              setRecipientForm({
                                id: rec.id,
                                name: rec.name,
                                aliases: (rec.aliases || []).join(', ')
                              });
                              setRecipientModalOpen(true);
                            }}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              isDarkMode
                                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            }`}
                            title="Sửa tên / từ khóa nhận diện"
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playClickSound();
                              setActiveRecipientForLetter(rec);
                              setLetterForm({
                                id: '',
                                keyTitle: '',
                                keyIcon: '🗝️',
                                letterPassword: '',
                                passwordHint: '',
                                title: '',
                                introQuote: '',
                                greeting: `Gửi ${rec.name} thân mến,`,
                                paragraphs: '',
                                secretUnsaid: '',
                                finalThought: ''
                              });
                              setLetterModalOpen(true);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-serif font-semibold transition-all cursor-pointer ${
                              isDarkMode
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40'
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-xs'
                            }`}
                          >
                            <Plus size={14} />
                            <span>Thêm Khóa Thư Cho {rec.name}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteVibeRecipient(rec.id, rec.name)}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              isDarkMode
                                ? 'bg-neutral-800 hover:bg-rose-900/80 text-neutral-400 hover:text-rose-200'
                                : 'bg-stone-100 hover:bg-rose-100 text-neutral-600 hover:text-rose-700'
                            }`}
                            title="Xóa người nhận này"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* DANH SÁCH CÁC CHIẾC KHÓA THƯ CỦA NGƯỜI ĐÓ (KHÓA 2) */}
                      <div className="space-y-3">
                        <span className={`text-xs font-serif font-medium block ${
                          isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
                        }`}>
                          Các chiếc khóa thư đã chuẩn bị ({rec.letters?.length || 0}):
                        </span>

                        {(!rec.letters || rec.letters.length === 0) ? (
                          <p className={`text-xs font-serif italic pl-2 ${
                            isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
                          }`}>
                            Chưa có chiếc khóa thư nào. Hãy bấm "Thêm Khóa Thư" để chuẩn bị thư cho {rec.name}.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {rec.letters.map((letObj) => (
                              <div
                                key={letObj.id}
                                className={`p-4 rounded-xl border flex items-start justify-between gap-3 group transition-all ${subCardCls}`}
                              >
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{letObj.keyIcon || '🗝️'}</span>
                                    <span className="font-serif font-bold text-sm">{letObj.keyTitle}</span>
                                  </div>
                                  <p className={`text-xs font-serif line-clamp-1 italic ${
                                    isDarkMode ? 'text-neutral-300' : 'text-stone-600'
                                  }`}>
                                    "{letObj.title}"
                                  </p>
                                  <div className={`text-[11px] font-mono pt-1 ${
                                    isDarkMode ? 'text-amber-300/90' : 'text-amber-800'
                                  }`}>
                                    <span>Mật khẩu: </span>
                                    <strong className="underline">{letObj.letterPassword}</strong>
                                    {letObj.passwordHint && (
                                      <span className={`ml-2 ${isDarkMode ? 'text-neutral-400' : 'text-stone-500'}`}>
                                        ({letObj.passwordHint})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundEngine.playClickSound();
                                      setActiveRecipientForLetter(rec);
                                      setLetterForm({
                                        id: letObj.id,
                                        keyTitle: letObj.keyTitle || '',
                                        keyIcon: letObj.keyIcon || '🗝️',
                                        letterPassword: letObj.letterPassword || '',
                                        passwordHint: letObj.passwordHint || '',
                                        title: letObj.title || '',
                                        introQuote: letObj.introQuote || '',
                                        greeting: letObj.content?.greeting || `Gửi ${rec.name} thân mến,`,
                                        paragraphs: Array.isArray(letObj.content?.paragraphs) ? letObj.content.paragraphs.join('\n\n') : (letObj.content?.paragraphs || ''),
                                        secretUnsaid: letObj.secretUnsaid?.content || '',
                                        finalThought: letObj.finalThought?.content || ''
                                      });
                                      setLetterModalOpen(true);
                                    }}
                                    className={`p-1.5 transition-colors cursor-pointer ${
                                      isDarkMode ? 'text-neutral-500 hover:text-amber-300' : 'text-stone-400 hover:text-amber-600'
                                    }`}
                                    title="Chỉnh sửa khóa thư này"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteVibeLetter(rec.id, letObj.id, letObj.keyTitle)}
                                    className={`p-1.5 transition-colors cursor-pointer ${
                                      isDarkMode ? 'text-neutral-500 hover:text-rose-400' : 'text-stone-400 hover:text-rose-600'
                                    }`}
                                    title="Xóa khóa này"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 2: THƯ ĐƯỜNG DẪN TRỰC TIẾP (/letter/:id)
            ======================================================== */}
        {activeStudioTab === 'direct' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-serif font-bold flex items-center gap-2 ${
                  isDarkMode ? 'text-white' : 'text-stone-900'
                }`}>
                  <Mail size={18} className="text-amber-500" />
                  <span>Danh Sách Thư Đường Link Riêng ({letters.length})</span>
                </h2>
                <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-stone-600'}`}>
                  Các lá thư có thể mở trực tiếp qua địa chỉ /letter/:id
                </p>
              </div>

              <Link
                to="/admin/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-serif font-bold text-xs shadow-md hover:bg-amber-400 transition-all"
              >
                <Plus size={15} />
                <span>Tạo Thư Link Riêng</span>
              </Link>
            </div>

            {letters.length === 0 ? (
              <div className={`p-12 rounded-3xl border border-dashed text-center space-y-3 ${
                isDarkMode ? 'bg-neutral-900/60 border-white/10 text-neutral-400' : 'bg-white border-neutral-300 text-stone-500 shadow-xs'
              }`}>
                <Mail size={36} className="mx-auto opacity-40" />
                <p className="font-serif text-base font-medium">Chưa có lá thư đường dẫn riêng nào.</p>
                <p className="text-xs opacity-75 max-w-sm mx-auto">
                  Bấm nút "Tạo Thư Link Riêng" phía trên để tạo lá thư độc lập đầu tiên kèm mã QR và liên kết riêng cho khách hàng.
                </p>
                <Link
                  to="/admin/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs shadow-md transition-all"
                >
                  <Plus size={15} />
                  <span>Tạo Lá Thư Đầu Tiên</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {letters.map((letter) => {
                  const themeInfo = THEMES[letter.theme] || THEMES.love;
                  return (
                    <div
                      key={letter.id}
                      className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 ${cardCls}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1 font-serif font-semibold">
                            <span>{themeInfo.emoji}</span>
                            <span>{themeInfo.name}</span>
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                            {letter.openedCount || 0} lượt mở
                          </span>
                        </div>
                        <h4 className="text-lg font-serif font-bold line-clamp-1">Gửi {letter.recipientName}</h4>
                        <p className={`text-xs font-serif italic mt-1 line-clamp-2 ${
                          isDarkMode ? 'text-neutral-300' : 'text-stone-600'
                        }`}>
                          "{letter.title}"
                        </p>
                      </div>

                      <div className={`pt-3 border-t flex items-center justify-between ${
                        isDarkMode ? 'border-white/10' : 'border-neutral-200'
                      }`}>
                        <Link
                          to={`/letter/${letter.slug || letter.id}`}
                          target="_blank"
                          className={`p-2 transition-colors ${
                            isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                          }`}
                          title="Xem thư"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSelectedShareLetter(letter)}
                          className={`p-2 transition-colors ${
                            isDarkMode ? 'text-neutral-400 hover:text-amber-300' : 'text-stone-600 hover:text-amber-700'
                          }`}
                          title="Chia sẻ & QR"
                        >
                          <Share2 size={16} />
                        </button>
                        <Link
                          to={`/admin/edit/${letter.id}`}
                          className={`p-2 transition-colors ${
                            isDarkMode ? 'text-neutral-400 hover:text-sky-300' : 'text-stone-600 hover:text-sky-700'
                          }`}
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteLetter(letter.id, letter.recipientName)}
                          className={`p-2 transition-colors ${
                            isDarkMode ? 'text-neutral-400 hover:text-rose-400' : 'text-stone-600 hover:text-rose-700'
                          }`}
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ========================================================
            TAB 3: QUẢN TRỊ TÀI KHOẢN THÀNH VIÊN GỬI THƯ (MEMBER ACCOUNTS)
            ======================================================== */}
        {activeStudioTab === 'users' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className={`text-lg font-serif font-bold flex items-center gap-2 ${
                  isDarkMode ? 'text-white' : 'text-stone-900'
                }`}>
                  <Users size={18} className="text-amber-500" />
                  <span>Danh Sách Tài Khoản Thành Viên ({users.length})</span>
                </h2>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-neutral-400' : 'text-stone-600'}`}>
                  Cấp tài khoản cho thành viên gửi nhận thư riêng biệt. Thông tin tài khoản quản trị tối cao của Admin được bảo mật riêng tư tuyệt đối.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClickSound();
                  setUserError('');
                  setUserForm({ username: '', password: '', displayName: '', avatar: '🌸' });
                  setUserModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
              >
                <UserPlus size={15} />
                <span>Cấp Tài Khoản Mới</span>
              </button>
            </div>

            {users.length === 0 ? (
              <div className={`p-12 rounded-3xl border border-dashed text-center space-y-3 ${
                isDarkMode ? 'bg-neutral-900/60 border-white/10 text-neutral-400' : 'bg-white border-neutral-300 text-stone-500 shadow-xs'
              }`}>
                <Users size={36} className="mx-auto opacity-40" />
                <p className="font-serif text-base font-medium">Chưa có tài khoản thành viên nào.</p>
                <p className="text-xs opacity-75 max-w-sm mx-auto">
                  Hãy bấm "Cấp Tài Khoản Mới" để tạo tài khoản cho người dùng mà bạn muốn cho phép gửi thư.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {users.map((user) => {
                  const isLocked = user.status === 'locked';
                  return (
                    <div
                      key={user.id}
                      className={`p-5 rounded-2xl border space-y-4 flex flex-col justify-between transition-all ${cardCls} ${
                        isLocked ? 'opacity-70 border-rose-400/40' : ''
                      }`}
                    >
                      <div>
                        {/* HEADER USER */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar avatar={user.avatar} size="md" />
                            <div>
                              <h4 className="font-serif font-bold text-base line-clamp-1">{user.displayName || user.username}</h4>
                              <p className="text-xs font-mono text-amber-700 dark:text-amber-400">@{user.username}</p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold uppercase tracking-wider ${
                            isLocked
                              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {isLocked ? 'Đã khóa' : 'Hoạt động'}
                          </span>
                        </div>

                        {/* MẬT KHẨU BAN ĐẦU CẤP CHO USER */}
                        <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between ${subCardCls}`}>
                          <div>
                            <span className={`text-[10px] uppercase font-sans tracking-wider block ${
                              isDarkMode ? 'text-neutral-400' : 'text-stone-500'
                            }`}>
                              Mật khẩu đăng nhập:
                            </span>
                            <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-300">
                              {user.initialPassword || '******'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyUserCreds(user)}
                            className={`p-2 rounded-lg text-xs font-serif flex items-center gap-1 transition-colors cursor-pointer ${
                              copiedPassId === user.id
                                ? 'bg-emerald-500 text-white'
                                : isDarkMode
                                  ? 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'
                                  : 'bg-white hover:bg-stone-200 text-stone-800 border border-stone-200 shadow-xs'
                            }`}
                            title="Copy thông tin đăng nhập gửi cho bạn này"
                          >
                            {copiedPassId === user.id ? <Check size={13} /> : <Copy size={13} />}
                            <span>{copiedPassId === user.id ? 'Đã copy' : 'Gửi bạn này'}</span>
                          </button>
                        </div>

                        {/* THỐNG KÊ THƯ */}
                        <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                          <div className={`p-2 rounded-xl border ${subCardCls}`}>
                            <span className={`text-[10px] block ${isDarkMode ? 'text-neutral-400' : 'text-stone-500'}`}>Đã gửi</span>
                            <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                              {user.sentCount || 0} lá
                            </span>
                          </div>
                          <div className={`p-2 rounded-xl border ${subCardCls}`}>
                            <span className={`text-[10px] block ${isDarkMode ? 'text-neutral-400' : 'text-stone-500'}`}>Nhận được</span>
                            <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400">
                              {user.receivedCount || 0} lá
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* HÀNH ĐỘNG QUẢN TRỊ */}
                      <div className={`pt-3 border-t flex items-center justify-between gap-2 ${
                        isDarkMode ? 'border-white/10' : 'border-neutral-200'
                      }`}>
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(user)}
                          className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                            isLocked
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                          }`}
                          title={isLocked ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản'}
                        >
                          {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                          <span>{isLocked ? 'Mở khóa' : 'Khóa'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClickSound();
                            setResetTargetUser(user);
                            setNewPasswordInput('');
                            setResetModalOpen(true);
                          }}
                          className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                            isDarkMode ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                          }`}
                          title="Đổi mật khẩu mới"
                        >
                          <Key size={14} />
                          <span>Đổi MK</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                            isDarkMode ? 'text-neutral-500 hover:text-rose-400 hover:bg-rose-950/30' : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Xóa tài khoản"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

      </div>

      {/* ================= MODAL CẤP TÀI KHOẢN MỚI ================= */}
      {userModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setUserModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
        >
          <div className={`max-w-md w-full p-6 sm:p-8 rounded-3xl border space-y-5 my-8 ${modalBoxCls}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDarkMode ? 'border-white/10' : 'border-neutral-200'
            }`}>
              <h3 className="font-serif font-bold text-lg text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <UserPlus size={18} />
                <span>Cấp Tài Khoản Gửi Thư Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className={`p-1 rounded-lg ${isDarkMode ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className={labelCls}>Tên đăng nhập (username - viết liền không dấu):</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  placeholder="VD: nguyenvanan, tranhoa..."
                  className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm font-mono outline-none ${inputCls}`}
                />
              </div>

              <div>
                <label className={labelCls}>Mật khẩu ban đầu:</label>
                <input
                  type="text"
                  required
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Nhập mật khẩu cấp cho bạn này..."
                  className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm font-mono outline-none font-bold text-amber-600 dark:text-amber-300 ${inputCls}`}
                />
                <span className={`text-[11px] block mt-1 ${isDarkMode ? 'text-neutral-500' : 'text-stone-500'}`}>
                  Mật khẩu này sẽ được hiển thị để bạn gửi trực tiếp cho người dùng.
                </span>
              </div>

              <div>
                <label className={labelCls}>Tên hiển thị (Nickname / Họ tên):</label>
                <input
                  type="text"
                  value={userForm.displayName}
                  onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
                  placeholder="VD: Nguyễn Văn An, Bạn Hoa..."
                  className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm outline-none ${inputCls}`}
                />
              </div>

              <div>
                <label className={labelCls}>Hình đại diện (Upload ảnh hoặc chọn Icon):</label>
                <div className="flex items-center gap-3 mt-2">
                  <UserAvatar avatar={userForm.avatar} size="lg" />
                  <div className="space-y-1">
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-serif font-semibold cursor-pointer transition-all ${
                      isDarkMode
                        ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border-white/10'
                        : 'bg-stone-100 hover:bg-stone-200 text-amber-800 border-stone-300 shadow-xs'
                    }`}>
                      <Upload size={13} />
                      <span>Tải ảnh từ máy</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setUserForm({ ...userForm, avatar: reader.result });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <p className={`text-[10px] ${isDarkMode ? 'text-neutral-500' : 'text-stone-500'}`}>
                      Hỗ trợ tải ảnh riêng JPG, PNG, WebP... hoặc chọn emoji bên dưới
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2.5">
                  {['👑', '🌸', '🌟', '💌', '🌿', '☕', '🦋', '🍓', '🧸', '🌙', '🎧', '🐱'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setUserForm({ ...userForm, avatar: emoji })}
                      className={`text-lg p-1.5 rounded-xl border transition-all cursor-pointer ${
                        userForm.avatar === emoji
                          ? 'bg-amber-500/20 border-amber-500 scale-110 shadow-xs'
                          : isDarkMode ? 'bg-neutral-800 border-white/10 hover:bg-neutral-700' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {userError && (
                <p className="text-xs text-rose-500 font-medium">{userError}</p>
              )}

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className={`w-1/3 py-2.5 rounded-xl font-serif text-xs cursor-pointer ${
                    isDarkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-serif font-bold text-xs hover:bg-amber-400 cursor-pointer shadow-md transition-all"
                >
                  Tạo & Cấp Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL THÔNG TIN TÀI KHOẢN VỪA TẠO ================= */}
      {createdUserCreds && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreatedUserCreds(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
        >
          <div className={`max-w-md w-full p-6 rounded-3xl border space-y-4 shadow-2xl ${modalBoxCls}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={20} />
                <span>Cấp Tài Khoản Thành Công!</span>
              </h3>
              <button
                type="button"
                onClick={() => setCreatedUserCreds(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl border bg-emerald-500/10 border-emerald-500/20">
              <UserAvatar avatar={createdUserCreds.avatar} size="md" />
              <div>
                <h4 className="font-serif font-bold text-sm">{createdUserCreds.displayName}</h4>
                <p className="text-xs font-mono text-amber-700 dark:text-amber-400">@{createdUserCreds.username}</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 text-xs font-mono ${subCardCls}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-500 dark:text-neutral-400 shrink-0">Link đăng nhập:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold truncate">
                  {createdUserCreds.loginUrl}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-neutral-400">Tài khoản:</span>
                <span className="font-bold">{createdUserCreds.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-neutral-400">Mật khẩu:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{createdUserCreds.password}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  soundEngine.playClickSound();
                  const text = `💌 Thông tin tài khoản gửi thư bí mật:\n- Trang web: ${createdUserCreds.loginUrl}\n- Tài khoản: ${createdUserCreds.username}\n- Mật khẩu: ${createdUserCreds.password}`;
                  await copyToClipboard(text);
                  setCopiedCreatedCreds(true);
                  setTimeout(() => setCopiedCreatedCreds(false), 2500);
                }}
                className={`w-full py-3 rounded-xl font-serif font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all ${
                  copiedCreatedCreds
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                }`}
              >
                {copiedCreatedCreds ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedCreatedCreds ? 'Đã sao chép vào bộ nhớ tạm!' : 'Sao chép thông tin gửi cho bạn này'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedUserCreds(null)}
                className={`w-full py-2.5 rounded-xl font-serif text-xs cursor-pointer ${
                  isDarkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL ĐỔI MẬT KHẨU CHO THÀNH VIÊN ================= */}
      {resetModalOpen && resetTargetUser && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setResetModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
        >
          <div className={`max-w-sm w-full p-6 rounded-3xl border space-y-4 ${modalBoxCls}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Key size={16} />
                <span>Đổi Mật Khẩu: {resetTargetUser.displayName || resetTargetUser.username}</span>
              </h3>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className={labelCls}>Mật khẩu mới:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm font-mono outline-none font-bold ${inputCls}`}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className={`w-1/3 py-2 rounded-xl text-xs ${
                    isDarkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 rounded-xl bg-amber-500 text-neutral-950 font-serif font-bold text-xs hover:bg-amber-400"
                >
                  Xác Nhận Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL THÊM NGƯỜI NHẬN MỚI CHO VIBE HUB ================= */}
      {recipientModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setRecipientModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
        >
          <div className={`max-w-md w-full p-6 sm:p-8 rounded-3xl border space-y-5 my-8 ${modalBoxCls}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDarkMode ? 'border-white/10' : 'border-neutral-200'
            }`}>
              <h3 className="font-serif font-bold text-lg text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <UserCheck size={18} />
                <span>{recipientForm.id ? 'Chỉnh Sửa Người Nhận' : 'Thêm Người Nhận Mới'} ({THEMES[selectedVibeTheme]?.name})</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setRecipientModalOpen(false)} 
                className={`p-1 rounded-lg ${isDarkMode ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRecipient} className="space-y-4">
              <div>
                <label className={labelCls}>Tên người nhận (ví dụ: Tú, Khuê, Hà Phương):</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={recipientForm.name}
                  onChange={(e) => setRecipientForm({ ...recipientForm, name: e.target.value })}
                  placeholder="Nhập tên người nhận..."
                  className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm outline-none ${inputCls}`}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Các từ khóa nhận diện hợp lệ ở Khóa 1 (cách nhau bởi dấu phẩy):
                </label>
                <input
                  type="text"
                  value={recipientForm.aliases}
                  onChange={(e) => setRecipientForm({ ...recipientForm, aliases: e.target.value })}
                  placeholder="VD: tú, tu, anh tú, bé tú..."
                  className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm outline-none ${inputCls}`}
                />
                <span className={`text-[11px] mt-1 block font-serif ${isDarkMode ? 'text-neutral-500' : 'text-stone-500'}`}>
                  Khi người này gõ bất kỳ từ nào ở trên vào Khóa 1, hệ thống sẽ nhận diện chính xác!
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRecipientModalOpen(false)}
                  className={`w-1/3 py-2.5 rounded-xl font-serif text-xs cursor-pointer ${
                    isDarkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  Hủy & Đóng
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-serif font-bold text-xs hover:bg-amber-400 cursor-pointer shadow-md"
                >
                  {recipientForm.id ? 'Cập Nhật Người Nhận' : 'Lưu Người Nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL THÊM KHÓA THƯ MỚI (KHÓA 2) CHO NGƯỜI NHẬN ================= */}
      {letterModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setLetterModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
        >
          <div className={`max-w-lg w-full p-6 sm:p-8 rounded-3xl border space-y-4 my-8 ${modalBoxCls}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDarkMode ? 'border-white/10' : 'border-neutral-200'
            }`}>
              <h3 className="font-serif font-bold text-lg text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <KeyRound size={18} />
                <span>{letterForm.id ? 'Chỉnh Sửa Khóa Thư Cho' : 'Thêm Khóa Thư Cho'}: {activeRecipientForLetter?.name}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setLetterModalOpen(false)} 
                className={`p-1 rounded-lg ${isDarkMode ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVibeLetter} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Tên chiếc khóa (VD: Lời Nhắn Mùa Đông):</label>
                  <input
                    type="text"
                    required
                    value={letterForm.keyTitle}
                    onChange={(e) => setLetterForm({ ...letterForm, keyTitle: e.target.value })}
                    placeholder="Tên hiển thị trên ổ khóa..."
                    className={`w-full mt-1 px-3 py-2 rounded-xl text-xs outline-none ${inputCls}`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Biểu tượng:</label>
                  <input
                    type="text"
                    value={letterForm.keyIcon}
                    onChange={(e) => setLetterForm({ ...letterForm, keyIcon: e.target.value })}
                    placeholder="VD: ☕, ❄️, 🌸"
                    className={`w-full mt-1 px-3 py-2 rounded-xl text-xs text-center outline-none ${inputCls}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Mật khẩu chiếc khóa này (Khóa 2):</label>
                  <input
                    type="text"
                    required
                    value={letterForm.letterPassword}
                    onChange={(e) => setLetterForm({ ...letterForm, letterPassword: e.target.value })}
                    placeholder="VD: dongam, noel..."
                    className={`w-full mt-1 px-3 py-2 rounded-xl font-mono text-xs font-bold text-amber-600 dark:text-amber-300 outline-none ${inputCls}`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Gợi ý mật khẩu (nếu có):</label>
                  <input
                    type="text"
                    value={letterForm.passwordHint}
                    onChange={(e) => setLetterForm({ ...letterForm, passwordHint: e.target.value })}
                    placeholder="VD: Ngày đầu chúng mình gặp..."
                    className={`w-full mt-1 px-3 py-2 rounded-xl text-xs outline-none ${inputCls}`}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Tiêu đề thư (khi mở ra):</label>
                <input
                  type="text"
                  value={letterForm.title}
                  onChange={(e) => setLetterForm({ ...letterForm, title: e.target.value })}
                  placeholder="Tiêu đề lá thư..."
                  className={`w-full mt-1 px-3 py-2 rounded-xl text-xs outline-none ${inputCls}`}
                />
              </div>

              <div>
                <label className={labelCls}>Các đoạn văn (cách nhau 2 lần Enter):</label>
                <textarea
                  rows={4}
                  value={letterForm.paragraphs}
                  onChange={(e) => setLetterForm({ ...letterForm, paragraphs: e.target.value })}
                  placeholder="Nhập nội dung tâm tư lá thư ở đây..."
                  className={`w-full mt-1 p-3 rounded-xl font-serif text-xs leading-relaxed outline-none ${inputCls}`}
                />
              </div>

              <div>
                <label className={labelCls}>💌 Điều chưa nói (bí mật bóc mở):</label>
                <input
                  type="text"
                  value={letterForm.secretUnsaid}
                  onChange={(e) => setLetterForm({ ...letterForm, secretUnsaid: e.target.value })}
                  placeholder="Nội dung điều chưa nói..."
                  className={`w-full mt-1 px-3 py-2 rounded-xl text-xs font-serif italic outline-none ${inputCls}`}
                />
              </div>

              <div>
                <label className={labelCls}>✨ Điều cuối cùng (spotlight bừng sáng):</label>
                <input
                  type="text"
                  value={letterForm.finalThought}
                  onChange={(e) => setLetterForm({ ...letterForm, finalThought: e.target.value })}
                  placeholder="Lời nhắn kết thúc ấm áp..."
                  className={`w-full mt-1 px-3 py-2 rounded-xl text-xs font-serif italic outline-none ${inputCls}`}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLetterModalOpen(false)}
                  className={`w-1/3 py-2.5 rounded-xl font-serif text-xs cursor-pointer ${
                    isDarkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  Hủy & Đóng
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-serif font-bold text-xs hover:bg-amber-400 cursor-pointer shadow-md"
                >
                  {letterForm.id ? 'Cập Nhật Khóa & Thư' : 'Lưu Chiếc Khóa & Thư'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CHIA SẺ & QR CODE ================= */}
      <ShareModal
        letter={selectedShareLetter}
        isOpen={Boolean(selectedShareLetter)}
        onClose={() => setSelectedShareLetter(null)}
      />

    </div>
  );
}
