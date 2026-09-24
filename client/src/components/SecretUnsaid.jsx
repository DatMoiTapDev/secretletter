import React, { useState } from 'react';
import { Mail, Sparkles, Heart, Lock, Unlock } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export default function SecretUnsaid({ config }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!config || !config.enabled || !config.content) return null;

  const handleOpen = () => {
    soundEngine.playWaxSealSound();
    setIsOpen(true);
  };

  return (
    <div className="my-10">
      {!isOpen ? (
        // Trạng thái chưa mở: Tấm phong bì nhỏ niêm phong kín
        <div 
          onClick={handleOpen}
          className="group relative max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-neutral-900 dark:to-neutral-850 border-2 border-dashed border-amber-400/60 dark:border-amber-500/40 text-center cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-300"
        >
          {/* Huy hiệu trang trí */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 mb-3 group-hover:scale-110 transition-transform">
            <Mail size={22} className="group-hover:rotate-12 transition-transform" />
          </div>

          <h4 className="font-serif text-lg font-bold text-neutral-900 dark:text-amber-200 mb-1">
            {config.prompt || '💌 Có một điều mình chưa nói...'}
          </h4>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 font-serif italic">
            Phần này được niêm phong kỹ càng. Nhấp để bóc mở bí mật.
          </p>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 text-sm font-semibold tracking-wide shadow-md group-hover:shadow-amber-500/30 transition-all cursor-pointer"
          >
            <Lock size={14} />
            <span>{config.buttonText || 'Mở phần này'}</span>
            <Sparkles size={14} />
          </button>
        </div>
      ) : (
        // Trạng thái đã mở: Mảnh giấy mở bung với nét chữ chân thành
        <div className="relative max-w-lg mx-auto p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-100/90 to-amber-50/90 dark:from-neutral-850 dark:to-neutral-900 border border-amber-400/40 shadow-xl transition-all animate-fade-in">
          
          <div className="flex items-center justify-between border-b border-amber-900/15 dark:border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-serif font-bold text-sm tracking-wide">
              <Unlock size={16} />
              <span>Điều sâu kín trong lòng</span>
            </div>
            <Heart size={16} className="text-rose-500 fill-rose-500 animate-pulse" />
          </div>

          <p className="font-serif text-base sm:text-lg text-neutral-900 dark:text-neutral-100 leading-relaxed italic">
            "{config.content}"
          </p>

          <div className="mt-4 text-right">
            <span className="text-[11px] font-serif text-neutral-500 dark:text-neutral-400">
              ✨ Giữ bí mật này cho riêng hai chúng ta nhé.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
