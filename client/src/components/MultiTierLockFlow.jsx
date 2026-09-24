import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  FolderLock,
  X,
  Palette,
  Sun,
  Moon
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export default function MultiTierLockFlow({
  theme,
  isDark = false,
  onBackToThemes,
  onLetterUnlocked,
  onToggleDark
}) {
  // Step 1: Khóa 1 (Nhập Tên / Mã định danh)
  // Step 2: Khóa 2 (Chọn Chiếc Khóa & Nhập Mật Khẩu riêng)
  const [step, setStep] = useState(1);

  // Dữ liệu người nhận sau khi qua Khóa 1
  const [recipient, setRecipient] = useState(null);
  const [availableKeys, setAvailableKeys] = useState([]);

  // Form state Khóa 1
  const [identifier, setIdentifier] = useState('');
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [idError, setIdError] = useState('');
  const [idShake, setIdShake] = useState(false);

  // Form state Khóa 2
  const [selectedKey, setSelectedKey] = useState(null);
  const [keyPassword, setKeyPassword] = useState('');
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [isUnlockingKey, setIsUnlockingKey] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [keyShake, setKeyShake] = useState(false);

  // XỬ LÝ KHÓA 1: NHẬN DIỆN TÊN NGƯỜI NHẬN
  const handleIdentifySubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    soundEngine.playClickSound();
    setIsIdentifying(true);
    setIdError('');
    setIdShake(false);

    try {
      const res = await fetch('/api/vibe-hub/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId: theme.id,
          identifier: identifier.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIdShake(true);
        setIdError(data.message || 'Hình như chưa đúng rồi... thử lại nhé 💌');
        setTimeout(() => setIdShake(false), 600);
        return;
      }

      // Khóa 1 thành công! Mở danh sách các chiếc khóa riêng của người đó
      soundEngine.playUnlockSound();
      setRecipient(data.recipient);
      setAvailableKeys(data.keys || []);
      setStep(2);
    } catch (err) {
      setIdError('Lỗi kết nối máy chủ, vui lòng thử lại.');
    } finally {
      setIsIdentifying(false);
    }
  };

  // XỬ LÝ KHÓA 2: MỞ KHÓA MỘT LÁ THƯ CỤ THỂ
  const handleUnlockLetterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedKey || !keyPassword.trim()) return;

    soundEngine.playClickSound();
    setIsUnlockingKey(true);
    setKeyError('');
    setKeyShake(false);

    try {
      const res = await fetch('/api/vibe-hub/unlock-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letterId: selectedKey.id,
          password: keyPassword.trim(),
          currentThemeId: theme.id
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setKeyShake(true);
        setKeyError(data.message || 'Mật khẩu chiếc khóa này chưa đúng... thử lại nhé 💌');
        setTimeout(() => setKeyShake(false), 600);
        return;
      }

      // Khóa 2 thành công! Bắt đầu hoạt ảnh mở phong bì 3D
      soundEngine.playUnlockSound();
      onLetterUnlocked(data.letter);
    } catch (err) {
      setKeyError('Lỗi kết nối tới máy chủ.');
    } finally {
      setIsUnlockingKey(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto px-4 py-8 z-30 animate-fade-in">
      
      {/* THANH ĐIỀU HƯỚNG QUAY LẠI / TẮT TRỞ LẠI TÁC VỤ */}
      <div className="mb-6 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClickSound();
            if (step === 2 && !selectedKey) {
              setStep(1);
            } else if (step === 2 && selectedKey) {
              setSelectedKey(null);
            } else {
              onBackToThemes();
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif backdrop-blur-md transition-all cursor-pointer ${
            isDark
              ? 'bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white border border-white/15'
              : 'bg-white/85 hover:bg-white text-neutral-800 hover:text-neutral-950 border border-neutral-300 shadow-sm'
          }`}
        >
          <ArrowLeft size={14} className="shrink-0" />
          <span className="hidden xs:inline">{step === 2 && selectedKey ? 'Chọn chiếc khóa khác' : step === 2 ? 'Nhập lại tên' : 'Đổi chủ đề khác'}</span>
          <span className="xs:hidden">{step === 2 && selectedKey ? 'Đổi khóa' : step === 2 ? 'Nhập lại' : 'Đổi chủ đề'}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Touch Button Nền Sáng / Nền Tối */}
          {onToggleDark && (
            <button
              type="button"
              onClick={onToggleDark}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-neutral-800 text-amber-300 border border-amber-400/30'
                  : 'bg-white text-neutral-800 border border-neutral-300 shadow-xs'
              }`}
              title={isDark ? 'Chạm để sang Nền Sáng ☀️' : 'Chạm để sang Nền Tối 🌙'}
            >
              {isDark ? <Moon size={13} className="text-sky-300" /> : <Sun size={13} className="text-amber-500" />}
              <span className="hidden xs:inline">{isDark ? 'Nền Tối' : 'Nền Sáng'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundEngine.playClickSound();
              onBackToThemes();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif backdrop-blur-md transition-all cursor-pointer ${
              isDark
                ? 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10'
                : 'bg-white/85 hover:bg-white text-neutral-700 hover:text-neutral-950 border border-neutral-300 shadow-sm'
            }`}
            title="Quay lại màn hình chính"
          >
            <X size={13} />
            <span className="hidden sm:inline">Về bong bóng</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          TẦNG 1: KHÓA 1 - NHẬN DIỆN NGƯỜI NHẬN (KHÔNG HIỆN DANH SÁCH)
          ======================================================== */}
      {step === 1 && (
        <div 
          className={`p-6 sm:p-8 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all ${
            isDark 
              ? 'bg-neutral-900/90 border-white/15 text-white' 
              : 'bg-white/95 border-amber-900/15 text-neutral-900 shadow-amber-950/10'
          } ${idShake ? 'animate-shake border-rose-500/60' : ''}`}
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-16 h-16 rounded-full border flex items-center justify-center mb-4 animate-pulse ${
              isDark
                ? 'bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border-amber-400/30 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                : 'bg-gradient-to-tr from-amber-100 to-amber-50 border-amber-300 text-amber-600 shadow-md'
            }`}>
              <Lock size={28} />
            </div>

            <h3 className={`text-xl sm:text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Chiếc Khóa Đầu Tiên
            </h3>

            <p className={`text-xs sm:text-sm font-serif italic mt-2 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
              "Hãy cho mình biết bạn là ai để tìm hòm thư của bạn nhé..."
            </p>
          </div>

          <form onSubmit={handleIdentifySubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Nhập tên hoặc mật mã nhận diện của bạn..."
                className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  isDark
                    ? 'bg-neutral-800/90 border-white/15 text-white placeholder-neutral-500'
                    : 'bg-neutral-50/90 border-neutral-300 text-neutral-900 placeholder-neutral-400'
                }`}
              />
              <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                <KeyRound size={18} />
              </div>
            </div>

            {idError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-300 text-xs animate-fade-in">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{idError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isIdentifying || !identifier.trim()}
              className="w-full py-3.5 px-6 rounded-xl bg-amber-300 hover:bg-amber-200 text-neutral-950 font-sans font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isIdentifying ? (
                <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Unlock size={16} />
                  <span>Xác Nhận Người Nhận</span>
                </>
              )}
            </button>

            {/* Nút hủy / quay lại chủ đề khác */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                onBackToThemes();
              }}
              className={`w-full py-2.5 px-4 rounded-xl font-serif text-xs border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-neutral-800/70 hover:bg-neutral-800 text-neutral-400 hover:text-white border-white/10'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-950 border-neutral-300'
              }`}
            >
              <ArrowLeft size={14} />
              <span>Quay lại chọn chủ đề khác</span>
            </button>
          </form>

          {/* THÔNG ĐIỆP BẢO MẬT RIÊNG TƯ */}
          <div className={`mt-6 pt-4 border-t text-center ${isDark ? 'border-white/10' : 'border-neutral-200'}`}>
            <p className={`text-[11px] font-serif ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              🔒 Hòm thư được mã hóa bảo mật • Chỉ người nhận sở hữu mật mã mới có thể mở khóa
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
          TẦNG 2: KHÓA 2 - DANH SÁCH CÁC CHIẾC KHÓA THƯ TÙY CHỌN
          ======================================================== */}
      {step === 2 && !selectedKey && (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl backdrop-blur-xl space-y-6 ${
          isDark
            ? 'bg-neutral-900/90 border-white/15 text-white'
            : 'bg-white/95 border-amber-900/15 text-neutral-900 shadow-amber-950/10'
        }`}>
          <div className="text-center">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-serif mb-2 ${
              isDark
                ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}>
              <Sparkles size={12} />
              <span>Đã nhận diện thành công</span>
            </div>

            <h3 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Chào {recipient?.name} ❤️
            </h3>

            <p className={`text-xs sm:text-sm font-serif italic mt-1 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
              "Bạn có những chiếc khóa bí mật dưới đây. Chọn chiếc khóa bạn muốn mở nhé:"
            </p>
          </div>

          {/* DANH SÁCH CÁC CHIẾC KHÓA CỦA NGƯỜI ĐÓ */}
          <div className="space-y-3">
            {availableKeys.map((k) => (
              <div
                key={k.id}
                onClick={() => {
                  soundEngine.playClickSound();
                  setSelectedKey(k);
                  setKeyPassword('');
                  setKeyError('');
                }}
                className={`group p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between ${
                  isDark
                    ? 'bg-neutral-800/80 hover:bg-neutral-800 border-white/10 hover:border-amber-400/50 hover:shadow-xl'
                    : 'bg-neutral-50 hover:bg-amber-50/80 border-neutral-200 hover:border-amber-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${
                    isDark
                      ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                      : 'bg-amber-100 border-amber-300 text-amber-800'
                  }`}>
                    {k.keyIcon || '🗝️'}
                  </div>
                  <div>
                    <h4 className={`font-serif font-bold text-sm transition-colors ${
                      isDark
                        ? 'text-white group-hover:text-amber-300'
                        : 'text-neutral-900 group-hover:text-amber-800'
                    }`}>
                      {k.keyTitle}
                    </h4>
                    <p className={`text-[11px] font-serif ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      Bấm để nhập mật khẩu chiếc khóa này
                    </p>
                  </div>
                </div>

                <div className={`p-2 rounded-xl transition-colors ${
                  isDark
                    ? 'bg-neutral-700/50 group-hover:bg-amber-500 group-hover:text-neutral-950 text-neutral-300'
                    : 'bg-neutral-200/80 group-hover:bg-amber-500 group-hover:text-neutral-950 text-neutral-600'
                }`}>
                  <Lock size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TẦNG 2 (PHỤ): NHẬP MẬT KHẨU CHO CHIẾC KHÓA ĐÃ CHỌN
          ======================================================== */}
      {step === 2 && selectedKey && (
        <div 
          className={`p-6 sm:p-8 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all ${
            isDark
              ? 'bg-neutral-900/90 border-white/15 text-white'
              : 'bg-white/95 border-amber-900/15 text-neutral-900 shadow-amber-950/10'
          } ${keyShake ? 'animate-shake border-rose-500/60' : ''}`}
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-16 h-16 rounded-full border flex items-center justify-center text-3xl mb-4 ${
              isDark
                ? 'bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                : 'bg-gradient-to-tr from-amber-100 to-amber-50 border-amber-300 shadow-md'
            }`}>
              {selectedKey.keyIcon || '🗝️'}
            </div>

            <h3 className={`text-xl sm:text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {selectedKey.keyTitle}
            </h3>

            <p className={`text-xs sm:text-sm font-serif italic mt-2 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
              "Nhập mật khẩu riêng của chiếc khóa này để bóc mở lá thư."
            </p>
          </div>

          <form onSubmit={handleUnlockLetterSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showKeyPassword ? 'text' : 'password'}
                autoFocus
                value={keyPassword}
                onChange={(e) => setKeyPassword(e.target.value)}
                placeholder="Nhập mật khẩu chiếc khóa này..."
                className={`w-full pl-11 pr-11 py-3.5 rounded-xl border text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  isDark
                    ? 'bg-neutral-800/90 border-white/15 text-white placeholder-neutral-500'
                    : 'bg-neutral-50/90 border-neutral-300 text-neutral-900 placeholder-neutral-400'
                }`}
              />
              <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                <Lock size={18} />
              </div>
              <button
                type="button"
                onClick={() => setShowKeyPassword(!showKeyPassword)}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {showKeyPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {keyError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-300 text-xs animate-fade-in">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{keyError}</span>
              </div>
            )}

            {/* GỢI Ý MẬT KHẨU TỪ NGƯỜI GỬI NẾU CÓ */}
            {selectedKey.passwordHint && (
              <div className={`p-3 rounded-xl border text-xs font-serif flex items-start gap-2 ${
                isDark
                  ? 'bg-amber-950/40 border-amber-500/20 text-amber-200'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <HelpCircle size={15} className={`shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                <span>
                  <strong>Gợi ý:</strong> {selectedKey.passwordHint}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUnlockingKey || !keyPassword.trim()}
              className="w-full py-3.5 px-6 rounded-xl bg-amber-300 hover:bg-amber-200 text-neutral-950 font-sans font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isUnlockingKey ? (
                <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Unlock size={16} />
                  <span>Mở Lá Thư Này</span>
                </>
              )}
            </button>

            {/* Nút quay lại danh sách chiếc khóa */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                setSelectedKey(null);
                setKeyPassword('');
                setKeyError('');
              }}
              className={`w-full py-2.5 px-4 rounded-xl font-serif text-xs border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-neutral-800/70 hover:bg-neutral-800 text-neutral-400 hover:text-white border-white/10'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-950 border-neutral-300'
              }`}
            >
              <ArrowLeft size={14} />
              <span>Quay lại danh sách khóa</span>
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
