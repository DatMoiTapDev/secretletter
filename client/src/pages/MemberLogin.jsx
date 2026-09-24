import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Sun,
  Moon,
  ArrowLeft,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export default function MemberLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Nếu đã đăng nhập thì tự động chuyển vào dashboard
    const token = localStorage.getItem('member_token');
    const user = localStorage.getItem('member_user');
    if (token && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleToggleDarkMode = () => {
    soundEngine.playClickSound();
    setIsDarkMode(prev => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tài khoản và mật khẩu.');
      return;
    }

    soundEngine.playClickSound();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('member_token', data.token);
        localStorage.setItem('member_user', JSON.stringify(data.user));
        navigate('/dashboard', { replace: true });
      } else {
        setError(data.message || 'Tài khoản hoặc mật khẩu không chính xác.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const cardCls = isDarkMode
    ? 'bg-neutral-900 border-white/15 text-neutral-100 shadow-2xl'
    : 'bg-white border-neutral-200 text-neutral-900 shadow-xl';
  const inputCls = isDarkMode
    ? 'bg-neutral-800 border-white/10 text-white placeholder-neutral-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30'
    : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30';
  const labelCls = isDarkMode
    ? 'text-neutral-300 font-medium text-xs'
    : 'text-stone-700 font-medium text-xs';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${
      isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#faf8f5] text-neutral-900'
    }`}>
      <div className={`max-w-md w-full p-8 rounded-3xl border space-y-6 ${cardCls}`}>
        
        {/* TOP BAR: BACK & LIGHT/DARK SWITCH */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            onClick={() => soundEngine.playClickSound()}
            className={`inline-flex items-center gap-1.5 text-xs font-serif transition-colors ${
              isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ArrowLeft size={14} />
            <span>Về trang chủ</span>
          </Link>

          <button
            type="button"
            onClick={handleToggleDarkMode}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-neutral-800 border-white/10 text-amber-300'
                : 'bg-stone-100 border-stone-200 text-amber-600'
            }`}
            title="Đổi giao diện sáng/tối"
          >
            {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>

        {/* HEADER ICON & TITLE */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Mail size={32} />
          </div>

          <h1 className="text-2xl font-serif font-bold tracking-tight">
            Đăng Nhập Gửi Thư
          </h1>
          <p className={`text-xs font-serif ${isDarkMode ? 'text-neutral-400' : 'text-stone-600'}`}>
            Không gian riêng tư để gửi và nhận những lá thư kỹ thuật số
          </p>
        </div>

        {/* FORM ĐĂNG NHẬP */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Tên tài khoản (Username):</label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
              placeholder="Nhập tên tài khoản của bạn..."
              className={`w-full mt-1.5 px-4 py-3 rounded-xl text-sm font-mono outline-none transition-all ${inputCls}`}
            />
          </div>

          <div>
            <label className={labelCls}>Mật khẩu:</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu do Admin cấp..."
              className={`w-full mt-1.5 px-4 py-3 rounded-xl text-sm outline-none transition-all ${inputCls}`}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Đang kiểm tra...</span>
            ) : (
              <>
                <span>Vào Hòm Thư Riêng</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* GHI CHÚ VỀ TÀI KHOẢN DO ADMIN CẤP */}
        <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
          isDarkMode ? 'bg-neutral-800/60 border-white/5 text-neutral-400' : 'bg-stone-50 border-stone-200 text-stone-600'
        }`}>
          <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
            <Sparkles size={14} />
            <span>Chính sách không gian riêng</span>
          </div>
          <p className="font-serif leading-relaxed text-[11px]">
            Tài khoản gửi thư do Quản trị viên (Admin) cấp riêng. Mỗi người có một không gian độc lập, không ai chạm đến thư của ai.
          </p>
          <p className="font-serif text-[11px] opacity-80">
            Nếu bạn chưa được cấp tài khoản, bạn vẫn có thể đọc thư bình thường tại trang chủ mà không cần đăng nhập.
          </p>
        </div>

        {/* FOOTER */}
        <div className="text-center pt-2">
          <Link
            to="/admin"
            className={`text-[11px] font-serif hover:underline ${
              isDarkMode ? 'text-neutral-500 hover:text-neutral-400' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Quản trị viên hệ thống? Đăng nhập Creator Studio
          </Link>
        </div>

      </div>
    </div>
  );
}
