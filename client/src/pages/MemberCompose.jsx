import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Send,
  ArrowLeft,
  Sparkles,
  Lock,
  Music,
  Heart,
  Calendar,
  Gift,
  Feather,
  Copy,
  Check,
  Eye,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';
import { THEMES, THEME_LIST } from '../types/theme';
import { soundEngine } from '../audio/soundEngine';
import ShareModal from '../components/ShareModal';

export default function MemberCompose() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('member_user') || 'null');
    } catch {
      return null;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  // Form fields
  const [recipientName, setRecipientName] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('love');
  const [title, setTitle] = useState('');
  const [greeting, setGreeting] = useState('');
  const [message, setMessage] = useState('');
  const [secretUnsaid, setSecretUnsaid] = useState('');
  const [finalThought, setFinalThought] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdLetter, setCreatedLetter] = useState(null);

  useEffect(() => {
    if (!user || !user.id) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const handleToggleDarkMode = () => {
    soundEngine.playClickSound();
    setIsDarkMode(prev => !prev);
  };

  const handleThemeChange = (themeId) => {
    soundEngine.playThemeTrack(themeId);
    setSelectedTheme(themeId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!recipientName.trim()) {
      setError('Vui lòng điền tên người nhận.');
      return;
    }

    if (!message.trim()) {
      setError('Vui lòng nhập nội dung tâm tư lá thư.');
      return;
    }

    soundEngine.playClickSound();
    setLoading(true);

    const paragraphs = message
      .split('\n\n')
      .map(p => p.trim())
      .filter(Boolean);

    const payload = {
      recipientName: recipientName.trim(),
      recipientUsername: recipientUsername.trim().toLowerCase(),
      theme: selectedTheme,
      title: title.trim() || 'Lá Thư Dành Riêng Cho Bạn',
      greeting: greeting.trim() || `Gửi ${recipientName.trim()},`,
      paragraphs: paragraphs.length > 0 ? paragraphs : [message.trim()],
      secretUnsaid: secretUnsaid.trim(),
      finalThought: finalThought.trim(),
      password: hasPassword ? password.trim() : '',
      passwordHint: hasPassword ? passwordHint.trim() : ''
    };

    try {
      const res = await fetch('/api/user/letters/compose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedLetter(data.data);
      } else {
        setError(data.message || 'Lỗi khi gửi thư.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const cardCls = isDarkMode
    ? 'bg-neutral-900/90 border-white/10 text-neutral-100 shadow-xl'
    : 'bg-white border-neutral-200/90 text-neutral-900 shadow-xs';
  const inputCls = isDarkMode
    ? 'bg-neutral-800 border-white/10 text-white placeholder-neutral-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30'
    : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30';
  const labelCls = isDarkMode
    ? 'text-neutral-300 font-medium text-xs'
    : 'text-stone-700 font-medium text-xs';

  return (
    <div className={`min-h-screen transition-colors duration-500 p-4 sm:p-8 ${
      isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#faf8f5] text-neutral-900'
    }`}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            onClick={() => soundEngine.playClickSound()}
            className={`inline-flex items-center gap-1.5 text-xs font-serif transition-colors ${
              isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ArrowLeft size={14} />
            <span>Quay lại hòm thư</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleDarkMode}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-neutral-900 border-white/10 text-amber-300'
                  : 'bg-white border-stone-200 text-amber-600 shadow-xs'
              }`}
              title="Đổi giao diện sáng/tối"
            >
              {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>
        </div>

        {/* HEADER */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold">
            <Feather size={14} />
            <span>Soạn Thư Mới</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold">
            Gửi Trao Tâm Tình & Kỷ Niệm
          </h1>
          <p className={`text-xs sm:text-sm font-serif ${isDarkMode ? 'text-neutral-400' : 'text-stone-600'}`}>
            Thư của bạn sẽ được kèm nhạc nền du dương, phong bì mở ảo diệu và mã bảo mật riêng tư
          </p>
        </div>

        {/* FORM SOẠN THƯ */}
        <form onSubmit={handleSubmit} className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardCls}`}>
          
          {/* PHẦN 1: NGƯỜI NHẬN */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-sm text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              1. Người nhận thư
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tên người nhận (Bắt buộc):</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="VD: Hà Phương, Bé Thỏ, Mẹ yêu..."
                  className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm outline-none ${inputCls}`}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Tài khoản hệ thống nhận (Tùy chọn - nếu là thành viên):
                </label>
                <input
                  type="text"
                  value={recipientUsername}
                  onChange={(e) => setRecipientUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="VD: username_nguoi_nhan (để thư vào Inbox bạn ấy)"
                  className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm font-mono outline-none ${inputCls}`}
                />
              </div>
            </div>
          </div>

          {/* PHẦN 2: CHỦ ĐỀ VÀ NHẠC NỀN */}
          <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                2. Chọn 1 trong 4 chủ đề & bài hát
              </h3>
              <span className={`text-[11px] font-serif ${isDarkMode ? 'text-neutral-400' : 'text-stone-500'}`}>
                Nhạc phát tự động khi mở
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEME_LIST.map((t) => {
                const isCur = selectedTheme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeChange(t.id)}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isCur
                        ? 'bg-amber-500/20 border-amber-500 text-amber-900 dark:text-white shadow-md scale-102 font-bold ring-1 ring-amber-400/50'
                        : isDarkMode
                          ? 'bg-neutral-800/60 border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-800'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <span className="text-2xl mb-1">{t.emoji}</span>
                    <span className="text-xs font-serif font-bold">{t.name}</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-serif">
                      <Music size={10} />
                      <span>{t.id === 'tet' ? 'Tết bình an' : t.id === 'birthday' ? 'Happy Birthday' : t.id === 'love' ? 'Từ khi gặp em' : 'Hết duyên thì đi'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PHẦN 3: NỘI DUNG LÁ THƯ */}
          <div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-white/10">
            <h3 className="font-serif font-bold text-sm text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              3. Nội dung lá thư
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tiêu đề thư:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Một chút bình yên gửi bạn..."
                  className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm outline-none ${inputCls}`}
                />
              </div>

              <div>
                <label className={labelCls}>Lời chào mở đầu:</label>
                <input
                  type="text"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder={`VD: Gửi ${recipientName || 'bạn'} thân mến,`}
                  className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm outline-none ${inputCls}`}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Nội dung tâm tư (Xuống dòng 2 lần để ngắt đoạn):</label>
              <textarea
                rows={6}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Viết những lời chân thành từ trái tim bạn ở đây..."
                className={`w-full mt-1.5 p-4 rounded-xl text-sm font-serif leading-relaxed outline-none ${inputCls}`}
              />
            </div>

            <div>
              <label className={labelCls}>💌 Điều chưa nói (Bí mật ẩn - người nhận bấm để bóc mở):</label>
              <input
                type="text"
                value={secretUnsaid}
                onChange={(e) => setSecretUnsaid(e.target.value)}
                placeholder="VD: Thực ra mình đã thương bạn từ ánh nhìn đầu tiên..."
                className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm font-serif italic outline-none ${inputCls}`}
              />
            </div>

            <div>
              <label className={labelCls}>✨ Lời nhắn cuối cùng (Hiển thị spotlight khi đọc hết thư):</label>
              <input
                type="text"
                value={finalThought}
                onChange={(e) => setFinalThought(e.target.value)}
                placeholder="VD: Chúc bạn một đời an yên và hạnh phúc..."
                className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm font-serif italic outline-none ${inputCls}`}
              />
            </div>
          </div>

          {/* PHẦN 4: KHÓA BẢO MẬT (TÙY CHỌN) */}
          <div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock size={15} />
                  <span>4. Khóa Mật Khẩu Thư</span>
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-stone-500'}`}>
                  Người nhận phải gõ đúng mật khẩu mới mở được phong bì
                </p>
              </div>

              <input
                type="checkbox"
                id="hasPasswordCheck"
                checked={hasPassword}
                onChange={(e) => setHasPassword(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {hasPassword && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className={labelCls}>Mật khẩu mở thư:</label>
                  <input
                    type="text"
                    required={hasPassword}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="VD: ngaysinh, yeuthuong..."
                    className={`w-full mt-1.5 px-4 py-2.5 rounded-xl font-mono text-sm font-bold text-amber-600 dark:text-amber-300 outline-none ${inputCls}`}
                  />
                </div>

                <div>
                  <label className={labelCls}>Gợi ý mật khẩu cho người nhận:</label>
                  <input
                    type="text"
                    value={passwordHint}
                    onChange={(e) => setPasswordHint(e.target.value)}
                    placeholder="VD: Ngày đầu chúng mình gặp..."
                    className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm outline-none ${inputCls}`}
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
              {error}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Đang niêm phong thư...</span>
              ) : (
                <>
                  <Send size={16} />
                  <span>Gửi Lá Thư Này</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* MODAL THÔNG BÁO GỬI THÀNH CÔNG */}
      {createdLetter && (
        <ShareModal
          letter={createdLetter}
          isOpen={Boolean(createdLetter)}
          onClose={() => {
            setCreatedLetter(null);
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
}
