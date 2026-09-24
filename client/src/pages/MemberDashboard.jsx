import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Send,
  Inbox,
  Plus,
  Eye,
  Trash2,
  Share2,
  Copy,
  Check,
  LogOut,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  ExternalLink,
  Sparkles,
  Lock,
  Unlock,
  HeartHandshake
} from 'lucide-react';
import { THEMES } from '../types/theme';
import ShareModal from '../components/ShareModal';
import { soundEngine } from '../audio/soundEngine';

export default function MemberDashboard() {
  const navigate = useNavigate();

  // Thông tin thành viên đăng nhập
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('member_user') || 'null');
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('outbox'); // 'outbox' | 'inbox'
  const [outboxLetters, setOutboxLetters] = useState([]);
  const [inboxLetters, setInboxLetters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedShareLetter, setSelectedShareLetter] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Giao diện Sáng/Tối & Âm thanh
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!user || !user.id) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

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

  const handleLogout = () => {
    soundEngine.playClickSound();
    localStorage.removeItem('member_token');
    localStorage.removeItem('member_user');
    navigate('/login', { replace: true });
  };

  // Tải danh sách thư đã gửi (Outbox)
  const fetchOutbox = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/letters/outbox', {
        headers: { 'x-user-id': user.id }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data.success) {
        setOutboxLetters(data.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải hòm thư đã gửi:', err);
    }
  };

  // Tải danh sách thư nhận được (Inbox)
  const fetchInbox = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/letters/inbox', {
        headers: { 'x-user-id': user.id }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data.success) {
        setInboxLetters(data.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải hòm thư nhận được:', err);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      setLoading(true);
      Promise.all([fetchOutbox(), fetchInbox()]).finally(() => setLoading(false));
    }
  }, [user]);

  // Xóa lá thư đã gửi
  const handleDeleteLetter = async (letterId, recipientName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa lá thư gửi "${recipientName}" không?`)) return;
    soundEngine.playClickSound();
    try {
      const res = await fetch(`/api/user/letters/${letterId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id }
      });
      if (res.ok) {
        setOutboxLetters(prev => prev.filter(l => l.id !== letterId && l.slug !== letterId));
      }
    } catch (err) {
      alert('Không thể xóa thư lúc này.');
    }
  };

  // Copy link nhanh
  const handleCopyLink = (letter) => {
    soundEngine.playClickSound();
    const url = `${window.location.origin}/letter/${letter.slug || letter.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(letter.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user) return null;

  const cardCls = isDarkMode
    ? 'bg-neutral-900/90 border-white/10 text-neutral-100 shadow-xl'
    : 'bg-white border-neutral-200/90 text-neutral-900 shadow-xs';
  const subCardCls = isDarkMode
    ? 'bg-neutral-800/80 border-white/5 text-neutral-200'
    : 'bg-stone-50 border-stone-200 text-stone-900';

  return (
    <div className={`min-h-screen transition-colors duration-500 p-4 sm:p-8 ${
      isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#faf8f5] text-neutral-900'
    }`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER THÀNH VIÊN */}
        <header className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 transition-colors ${
          isDarkMode ? 'border-white/10' : 'border-neutral-200'
        }`}>
          {/* USER INFO */}
          <div className="flex items-center gap-3.5">
            <span className="text-4xl p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-xs">
              {user.avatar || '✉️'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-xl sm:text-2xl font-serif font-bold ${
                  isDarkMode ? 'text-white' : 'text-neutral-900'
                }`}>
                  {user.displayName || user.username}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  isDarkMode ? 'bg-neutral-800 text-amber-400' : 'bg-amber-100 text-amber-800'
                }`}>
                  @{user.username}
                </span>
              </div>
              <p className={`text-xs mt-0.5 font-serif ${isDarkMode ? 'text-neutral-400' : 'text-stone-600'}`}>
                Hòm thư riêng tư - Chỉ bạn mới có thể xem và quản lý thư của mình
              </p>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* NÚT SOẠN THƯ MỚI */}
            <Link
              to="/dashboard/compose"
              onClick={() => soundEngine.playClickSound()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Gửi Thư Mới</span>
            </Link>

            {/* TOUCH BUTTON: NỀN SÁNG ☀️ / NỀN TỐI 🌙 */}
            <button
              type="button"
              onClick={handleToggleDarkMode}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-sans font-medium transition-all shadow-xs cursor-pointer ${
                isDarkMode
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-400/30'
                  : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 shadow-xs'
              }`}
              title={isDarkMode ? 'Chuyển sang Nền Sáng ☀️' : 'Chuyển sang Nền Tối 🌙'}
            >
              {isDarkMode ? <Moon size={14} className="text-sky-300" /> : <Sun size={14} className="text-amber-500" />}
            </button>

            {/* BỘ ĐIỀU CHỈNH ÂM LƯỢNG */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDarkMode
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-white/10'
                  : 'bg-white hover:bg-neutral-100 text-amber-700 border border-neutral-300 shadow-xs'
              }`}
              title={isMuted ? 'Đang tắt âm thanh' : 'Bật/Tắt âm thanh'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {/* 2 MÀN HÌNH */}
            <Link
              to="/dual"
              onClick={() => soundEngine.playClickSound()}
              className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-sans transition-all ${
                isDarkMode ? 'bg-neutral-900 text-neutral-300 border border-white/10' : 'bg-white text-stone-700 border border-neutral-300 shadow-xs'
              }`}
              title="Xem 2 màn hình"
            >
              <Smartphone size={13} className="text-amber-500" />
              <Monitor size={13} className="text-sky-500" />
            </Link>

            {/* TRANG CHỦ */}
            <Link
              to="/"
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-serif transition-colors ${
                isDarkMode ? 'bg-neutral-900 text-neutral-300 border border-white/10' : 'bg-white text-stone-700 border border-neutral-300 shadow-xs'
              }`}
            >
              <span>Trang chủ</span>
              <ExternalLink size={12} />
            </Link>

            {/* ĐĂNG XUẤT */}
            <button
              type="button"
              onClick={handleLogout}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDarkMode ? 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white' : 'bg-white border-neutral-300 text-stone-500 hover:text-stone-900 shadow-xs'
              }`}
              title="Đăng xuất"
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* NÚT CHUYỂN TABS: HÒM THƯ ĐÃ GỬI & HÒM THƯ NHẬN ĐƯỢC */}
        <div className={`flex items-center gap-3 border-b pb-3 ${
          isDarkMode ? 'border-white/10' : 'border-neutral-200'
        }`}>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClickSound();
              setActiveTab('outbox');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer ${
              activeTab === 'outbox'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : isDarkMode
                  ? 'bg-neutral-900 text-neutral-400 hover:text-white'
                  : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200 shadow-xs'
            }`}
          >
            <Send size={15} />
            <span>Thư Đã Gửi ({outboxLetters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClickSound();
              setActiveTab('inbox');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : isDarkMode
                  ? 'bg-neutral-900 text-neutral-400 hover:text-white'
                  : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200 shadow-xs'
            }`}
          >
            <Inbox size={15} />
            <span>Thư Nhận Được ({inboxLetters.length})</span>
          </button>
        </div>

        {/* ================= OUTBOX: THƯ ĐÃ GỬI ================= */}
        {activeTab === 'outbox' && (
          <div className="space-y-4">
            {outboxLetters.length === 0 ? (
              <div className={`p-12 rounded-3xl border border-dashed text-center space-y-3 ${
                isDarkMode ? 'bg-neutral-900/60 border-white/10 text-neutral-400' : 'bg-white border-neutral-300 text-stone-500 shadow-xs'
              }`}>
                <Send size={36} className="mx-auto opacity-40 text-amber-500" />
                <p className="font-serif text-base font-medium">Bạn chưa gửi lá thư nào.</p>
                <p className="text-xs opacity-75 max-w-sm mx-auto">
                  Hãy gửi lá thư bí mật đầu tiên đến người thương, bạn bè với nhạc nền và giao diện cảm xúc tuyệt đẹp.
                </p>
                <Link
                  to="/dashboard/compose"
                  className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs shadow-md transition-all"
                >
                  <Plus size={15} />
                  <span>Soạn Lá Thư Đầu Tiên</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {outboxLetters.map((letter) => {
                  const themeInfo = THEMES[letter.theme] || THEMES.love;
                  return (
                    <div
                      key={letter.id}
                      className={`p-5 rounded-2xl border space-y-4 flex flex-col justify-between ${cardCls}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-serif font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <span>{themeInfo.emoji}</span>
                            <span>{themeInfo.name}</span>
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                            {letter.openedCount || 0} lượt mở
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-base line-clamp-1">
                          Gửi {letter.recipientName}
                          {letter.recipientUsername && (
                            <span className="text-xs font-mono text-amber-600 dark:text-amber-400 ml-1.5">
                              (@{letter.recipientUsername})
                            </span>
                          )}
                        </h4>
                        <p className={`text-xs font-serif italic mt-1 line-clamp-2 ${
                          isDarkMode ? 'text-neutral-300' : 'text-stone-600'
                        }`}>
                          "{letter.title}"
                        </p>

                        <div className={`mt-3 pt-2.5 border-t text-[11px] font-mono flex items-center justify-between ${
                          isDarkMode ? 'border-white/5 text-neutral-500' : 'border-neutral-100 text-stone-500'
                        }`}>
                          <span>Mã: {letter.id}</span>
                          {letter.hasPassword ? (
                            <span className="text-amber-500 flex items-center gap-1">
                              <Lock size={11} /> Có mật khẩu
                            </span>
                          ) : (
                            <span className="opacity-60 flex items-center gap-1">
                              <Unlock size={11} /> Mở tự do
                            </span>
                          )}
                        </div>
                      </div>

                      {/* HÀNH ĐỘNG */}
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
                          onClick={() => handleCopyLink(letter)}
                          className={`p-2 transition-colors cursor-pointer ${
                            copiedId === letter.id
                              ? 'text-emerald-500 font-bold'
                              : isDarkMode ? 'text-neutral-400 hover:text-amber-300' : 'text-stone-600 hover:text-amber-700'
                          }`}
                          title="Copy đường dẫn nhanh"
                        >
                          {copiedId === letter.id ? <Check size={16} /> : <Copy size={16} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedShareLetter(letter)}
                          className={`p-2 transition-colors cursor-pointer ${
                            isDarkMode ? 'text-neutral-400 hover:text-amber-300' : 'text-stone-600 hover:text-amber-700'
                          }`}
                          title="Mã QR & Chia sẻ"
                        >
                          <Share2 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteLetter(letter.id, letter.recipientName)}
                          className={`p-2 transition-colors cursor-pointer ${
                            isDarkMode ? 'text-neutral-400 hover:text-rose-400' : 'text-stone-600 hover:text-rose-700'
                          }`}
                          title="Xóa lá thư này"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= INBOX: THƯ NHẬN ĐƯỢC ================= */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            {inboxLetters.length === 0 ? (
              <div className={`p-12 rounded-3xl border border-dashed text-center space-y-3 ${
                isDarkMode ? 'bg-neutral-900/60 border-white/10 text-neutral-400' : 'bg-white border-neutral-300 text-stone-500 shadow-xs'
              }`}>
                <Inbox size={36} className="mx-auto opacity-40 text-sky-500" />
                <p className="font-serif text-base font-medium">Chưa có lá thư nào được gửi đến bạn.</p>
                <p className="text-xs opacity-75 max-w-sm mx-auto">
                  Khi người khác gửi thư đến tên tài khoản <strong className="text-amber-600 font-mono">@{user.username}</strong>, thư sẽ xuất hiện tại đây ngay lập tức!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {inboxLetters.map((letter) => {
                  const themeInfo = THEMES[letter.theme] || THEMES.love;
                  return (
                    <div
                      key={letter.id}
                      className={`p-5 rounded-2xl border space-y-4 flex flex-col justify-between ${cardCls}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-serif font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <span>{themeInfo.emoji}</span>
                            <span>{themeInfo.name}</span>
                          </span>
                          <span className={`text-[10px] font-mono ${isDarkMode ? 'text-neutral-400' : 'text-stone-500'}`}>
                            {new Date(letter.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xl">{letter.senderAvatar || '💌'}</span>
                          <div>
                            <span className={`text-[11px] block ${isDarkMode ? 'text-neutral-400' : 'text-stone-500'}`}>
                              Từ người gửi:
                            </span>
                            <h4 className="font-serif font-bold text-base text-amber-700 dark:text-amber-300">
                              {letter.senderName || letter.senderUsername || 'Người giấu tên'}
                            </h4>
                          </div>
                        </div>

                        <p className={`text-xs font-serif italic mt-3 line-clamp-2 ${
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
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs text-center shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          <Eye size={14} />
                          <span>Mở Thư Ngay</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL CHIA SẺ & QR CODE */}
      <ShareModal
        letter={selectedShareLetter}
        isOpen={Boolean(selectedShareLetter)}
        onClose={() => setSelectedShareLetter(null)}
      />
    </div>
  );
}
