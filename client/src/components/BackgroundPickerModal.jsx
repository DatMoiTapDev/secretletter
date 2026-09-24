import React, { useEffect } from 'react';
import { X, Check, Palette } from 'lucide-react';
import { THEME_LIST } from '../types/theme';
import { soundEngine } from '../audio/soundEngine';

export default function BackgroundPickerModal({
  isOpen,
  currentThemeId,
  onSelectTheme,
  onClose
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundEngine.playClickSound();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-fade-in"
    >
      <div className="relative w-full max-w-xl p-6 sm:p-7 rounded-3xl bg-neutral-950/95 border border-white/10 text-neutral-100 shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl space-y-6">
        
        {/* Nút đóng */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClickSound();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          title="Đóng bảng chọn"
        >
          <X size={18} />
        </button>

        {/* Tiêu đề tối giản */}
        <div className="text-center pt-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 text-amber-300 mb-2.5">
            <Palette size={18} />
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-normal text-white tracking-tight">
            Không Gian Trải Nghiệm
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 font-sans mt-1">
            Chọn không gian phù hợp với cảm xúc của bạn
          </p>
        </div>

        {/* Lưới 8 không gian tối giản */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {THEME_LIST.map((theme) => {
            const isSelected = currentThemeId === theme.id;

            return (
              <div
                key={theme.id}
                onClick={() => {
                  soundEngine.playUnlockSound();
                  onSelectTheme(theme);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all duration-300 cursor-pointer group ${
                  isSelected
                    ? 'bg-white/[0.09] border-amber-300/80 shadow-[0_0_20px_rgba(251,191,36,0.15)] ring-1 ring-amber-300/40'
                    : 'bg-white/[0.03] border-white/8 hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                {/* Header card: Emoji + Checkmark */}
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                    {theme.emoji}
                  </span>
                  
                  {isSelected ? (
                    <div className="w-4 h-4 rounded-full bg-amber-300 text-neutral-950 flex items-center justify-center shadow-xs">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-white/15" />
                  )}
                </div>

                {/* Tên chủ đề */}
                <div className="my-2 w-full">
                  <h4 className="font-serif font-medium text-xs sm:text-sm text-neutral-100 group-hover:text-amber-200 transition-colors truncate">
                    {theme.name}
                  </h4>
                </div>

                {/* Dải màu xem trước mượt mà */}
                <div className="w-full flex items-center gap-1 px-1 py-1 rounded-full bg-black/40 border border-white/5">
                  {theme.previewColors?.map((col, idx) => (
                    <div 
                      key={idx} 
                      className="flex-1 h-1.5 rounded-full"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chú thích đồng bộ */}
        <div className="pt-2 border-t border-white/8 text-center">
          <p className="text-[11px] text-neutral-400 font-sans">
            Mọi lá thư và mật khẩu đều được đồng bộ liền mạch trên tất cả không gian.
          </p>
        </div>

      </div>
    </div>
  );
}
