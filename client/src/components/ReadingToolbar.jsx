import React, { useState } from 'react';
import { Type, Volume2, VolumeX, Sparkles, Moon, Sun, Settings2, X, Sliders } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export default function ReadingToolbar({
  fontSize,
  setFontSize,
  isDarkPaper,
  setIsDarkPaper,
  particlesActive,
  setParticlesActive,
  isMuted,
  setIsMuted,
  volume = 0.4,
  onVolumeChange,
  isDarkMode = false,
  onToggleDarkMode,
  onThemeChange,
  currentThemeId
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleFontSizeChange = (delta) => {
    soundEngine.playClickSound();
    setFontSize((prev) => {
      const sizes = ['sm', 'base', 'lg', 'xl'];
      const curIdx = sizes.indexOf(prev);
      const nextIdx = Math.max(0, Math.min(sizes.length - 1, curIdx + delta));
      return sizes[nextIdx];
    });
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 max-w-[calc(100vw-2rem)]">
      {/* NÚT MỞ THANH ĐIỀU KHIỂN */}
      {!isOpen ? (
        <div className="flex items-center gap-2">
          {/* Nút bật/tắt nhanh âm thanh */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-3 rounded-full bg-neutral-900/85 hover:bg-neutral-800 text-amber-400 border border-white/15 shadow-xl backdrop-blur-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="animate-pulse" />}
          </button>

          {/* Nút Chế độ đọc */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClickSound();
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-neutral-900/85 hover:bg-neutral-800 text-white border border-white/15 shadow-xl backdrop-blur-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sliders size={16} className="text-amber-400" />
            <span className="text-xs font-sans font-medium">Tùy chỉnh</span>
          </button>
        </div>
      ) : (
        /* HỘP BẢNG ĐIỀU KHIỂN CHI TIẾT */
        <div className="w-[calc(100vw-2rem)] max-w-xs sm:w-80 p-4 sm:p-5 rounded-3xl bg-neutral-950/95 border border-white/15 text-white shadow-2xl backdrop-blur-xl animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="font-serif font-bold text-sm text-amber-300 flex items-center gap-1.5">
              <Settings2 size={16} />
              <span>Tùy Chỉnh Đọc Thư</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          {/* 1. Touch Button Nền Sáng / Nền Tối */}
          {onToggleDarkMode && (
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span>Không gian</span>
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-white transition-colors cursor-pointer"
              >
                {isDarkMode ? (
                  <>
                    <Moon size={14} className="text-sky-300" />
                    <span>Nền Tối 🌙</span>
                  </>
                ) : (
                  <>
                    <Sun size={14} className="text-amber-400" />
                    <span>Nền Sáng ☀️</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 2. Thanh trượt âm lượng lớn / nhỏ (Volume Slider) */}
          <div className="space-y-1.5 pt-1 border-t border-white/8">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span className="flex items-center gap-1.5">
                <Volume2 size={14} className="text-amber-400" />
                <span>Âm lượng nhạc</span>
              </span>
              <span className="font-mono text-[11px] text-amber-300">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange && onVolumeChange(e.target.value)}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>

          {/* 3. Cỡ chữ A- / A+ */}
          <div className="flex items-center justify-between text-xs text-neutral-300 pt-1 border-t border-white/8">
            <span>Cỡ chữ</span>
            <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1 border border-white/10">
              <button
                type="button"
                onClick={() => handleFontSizeChange(-1)}
                className="px-2.5 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-white font-serif font-bold"
              >
                A-
              </button>
              <span className="px-2 font-mono text-[11px] text-amber-300 uppercase">{fontSize}</span>
              <button
                type="button"
                onClick={() => handleFontSizeChange(1)}
                className="px-2.5 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-white font-serif font-bold"
              >
                A+
              </button>
            </div>
          </div>

          {/* 4. Giấy thư (Giấy da / Giấy đêm) */}
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span>Giấy thư</span>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                setIsDarkPaper(!isDarkPaper);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-white"
            >
              {isDarkPaper ? (
                <>
                  <Moon size={14} className="text-sky-300" />
                  <span>Giấy đêm</span>
                </>
              ) : (
                <>
                  <Sun size={14} className="text-amber-400" />
                  <span>Giấy da</span>
                </>
              )}
            </button>
          </div>

          {/* 5. Hiệu ứng hạt rơi */}
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span>Hiệu ứng hạt rơi</span>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                setParticlesActive(!particlesActive);
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                particlesActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-white/10'
              }`}
            >
              <span className="flex items-center gap-1">
                <Sparkles size={12} />
                <span>{particlesActive ? 'Bật' : 'Tắt'}</span>
              </span>
            </button>
          </div>

          {/* 6. Chuyển đổi 4 chủ đề cốt lõi */}
          {onThemeChange && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-xs text-neutral-300 block font-sans">Đổi chủ đề:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'tet', icon: '🧧', title: 'Tết Bình An' },
                  { id: 'birthday', icon: '🎂', title: 'Sinh Nhật Rực Rỡ' },
                  { id: 'cute', icon: '💕', title: 'Ngọt Ngào Dễ Thương' },
                  { id: 'emotional', icon: '🌙', title: 'Tâm Tình Sâu Lắng' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClickSound();
                      onThemeChange(t.id);
                    }}
                    className={`p-2 rounded-xl border text-center text-sm transition-all cursor-pointer ${
                      currentThemeId === t.id
                        ? 'bg-amber-300 text-neutral-950 border-amber-200 scale-105 shadow-sm'
                        : 'bg-neutral-800 border-white/10 hover:bg-neutral-700'
                    }`}
                    title={t.title}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
