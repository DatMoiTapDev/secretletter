import React, { useState, useRef, useEffect } from 'react';
import { Lock, Eye, EyeOff, X, Sparkles, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export default function PasswordModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  errorMsg = '',
  passwordHint = ''
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (errorMsg) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 600);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    soundEngine.playClickSound();
    onSubmit(password);
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundEngine.playClickSound();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-300"
    >
      
      {/* Container hộp khóa */}
      <div 
        className={`relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-neutral-900/90 border border-white/15 text-neutral-100 shadow-[0_20px_60px_rgba(0,0,0,0.85)] transition-all ${
          isShaking ? 'animate-shake border-rose-500/60' : ''
        }`}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClickSound();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Biểu tượng ổ khóa vàng phát sáng */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border border-amber-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <Lock size={28} className="text-amber-400" />
            </div>
            <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-lg -z-10 animate-pulse" />
          </div>

          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            Lá thư này được khóa riêng cho bạn
          </h3>

          <p className="text-sm text-neutral-300 mt-2 font-serif italic">
            "Nhập mật khẩu để mở thư nhé."
          </p>
        </div>

        {/* Form nhập mật khẩu */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu lá thư..."
              disabled={isLoading}
              className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-neutral-800/90 border border-white/15 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-400/80 focus:border-transparent transition-all shadow-inner text-base"
            />
            
            {/* Icon chìa khóa bên trái */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              <KeyRound size={18} />
            </div>

            {/* Nút ẩn/hiện mật khẩu */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Thông báo lỗi khi nhập sai mật khẩu */}
          {errorMsg && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-300 text-xs sm:text-sm animate-fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Gợi ý mật khẩu từ người gửi nếu có */}
          {passwordHint && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-500/20 text-amber-200 text-xs">
              <Sparkles size={14} className="shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Gợi ý từ người gửi:</strong> {passwordHint}
              </span>
            </div>
          )}

          {/* Nút Mở khóa */}
          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full py-3.5 px-6 rounded-xl bg-amber-300 hover:bg-amber-200 text-neutral-950 font-sans font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock size={16} />
                <span>Mở khóa lá thư</span>
              </>
            )}
          </button>

          {/* Nút quay lại / đóng */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClickSound();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-white font-serif text-xs border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Quay lại phong bì / Đóng</span>
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-neutral-400">
            Mật khẩu được mã hóa an toàn • Không hiển thị trên đường dẫn URL
          </p>
        </div>

      </div>
    </div>
  );
}
