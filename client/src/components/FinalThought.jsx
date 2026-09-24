import React, { useState } from 'react';
import { Sparkles, Heart, Gift, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export default function FinalThought({ config }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!config || !config.enabled || !config.content) return null;

  const handleOpen = () => {
    soundEngine.playUnlockSound();
    setIsOpen(true);
  };

  const handleClose = () => {
    soundEngine.playClickSound();
    setIsOpen(false);
  };

  return (
    <div className="mt-14 mb-8 text-center">
      {/* Tấm thiệp kết thúc chờ mở */}
      <div 
        onClick={handleOpen}
        className="inline-flex flex-col items-center p-6 rounded-2xl bg-white/10 dark:bg-neutral-800/40 border border-amber-300/30 backdrop-blur-md shadow-lg hover:shadow-2xl hover:border-amber-400/60 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group max-w-sm mx-auto"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 flex items-center justify-center mb-3 shadow-md group-hover:rotate-12 transition-transform">
          <Gift size={22} />
        </div>

        <span className="font-serif text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-1">
          {config.prompt || 'Còn một điều cuối cùng...'}
        </span>

        <span className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1 font-serif">
          <span>Chạm vào đây trước khi rời đi</span>
          <Sparkles size={12} />
        </span>
      </div>

      {/* MODAL SPOTLIGHT BỪNG SÁNG KHI BẤM 'ĐIỀU CUỐI CÙNG' */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={handleClose}
        >
          {/* Vùng sáng Spotlight */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-amber-400/20 blur-3xl animate-pulse" />
          </div>

          <div 
            className="relative max-w-md w-full p-8 rounded-3xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-amber-400/40 text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Heart size={30} className="fill-amber-400/30 animate-bounce" style={{ animationDuration: '2s' }} />
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-4">
              Lời Nhắn Cuối Cùng
            </h3>

            <p className="font-serif text-lg sm:text-xl text-amber-100 leading-relaxed italic mb-6">
              "{config.content}"
            </p>

            <div className="inline-flex items-center gap-2 text-xs text-neutral-400 font-serif">
              <Sparkles size={13} className="text-amber-400" />
              <span>Cảm ơn bạn đã luôn hiện diện và lắng nghe.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
