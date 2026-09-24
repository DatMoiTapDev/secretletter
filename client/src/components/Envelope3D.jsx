import React, { useState, useEffect } from 'react';
import { Lock, Sparkles, Heart } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export default function Envelope3D({
  recipientName = 'Bạn thân mến',
  introQuote = 'Có một vài điều mình muốn bạn đọc thật chậm...',
  theme,
  isUnlocked = false,
  onUnlockClick,
  onAnimationComplete
}) {
  const [flapOpen, setFlapOpen] = useState(false);
  const [sealCracked, setSealCracked] = useState(false);
  const [letterRising, setLetterRising] = useState(false);
  const [lightBurst, setLightBurst] = useState(false);

  useEffect(() => {
    if (isUnlocked) {
      // 1. Phá vỡ con dấu sáp
      setSealCracked(true);
      soundEngine.playWaxSealSound();

      // 2. Lật mở nắp phong bì
      const flapTimer = setTimeout(() => {
        setFlapOpen(true);
      }, 350);

      // 3. Tỏa luồng sáng kỳ diệu
      const lightTimer = setTimeout(() => {
        setLightBurst(true);
        soundEngine.playUnlockSound();
      }, 700);

      // 4. Lá thư trồi lên từ trong phong bì
      const riseTimer = setTimeout(() => {
        setLetterRising(true);
      }, 1000);

      // 5. Chuyển sang màn hình đọc toàn diện
      const finishTimer = setTimeout(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 2600);

      return () => {
        clearTimeout(flapTimer);
        clearTimeout(lightTimer);
        clearTimeout(riseTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [isUnlocked, onAnimationComplete]);

  // Lấy class con dấu theo theme
  const getSealClass = (type) => {
    switch (type) {
      case 'gold': return 'wax-seal-gold';
      case 'navy': return 'wax-seal-navy';
      case 'rose': return 'wax-seal-rose';
      case 'emerald': return 'wax-seal-emerald';
      default: return 'wax-seal';
    }
  };

  const env = theme?.envelope || {
    body: 'bg-gradient-to-b from-[#e11d48] to-[#be123c]',
    flap: 'bg-gradient-to-b from-[#f43f5e] to-[#e11d48]',
    inner: 'bg-[#ffe4e6]',
    border: 'border-amber-300/80',
    sealType: 'gold',
    sealSymbol: '福',
    nameColor: 'text-yellow-300'
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[75vh] w-full max-w-lg mx-auto px-4 py-8 perspective-1000 select-none">
      
      {/* Tia sáng bùng nổ khi mở phong bì */}
      {lightBurst && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
          <div className="w-96 h-96 rounded-full light-beam blur-xl" />
        </div>
      )}

      {/* Dòng giới thiệu phía trên phong bì */}
      <div className={`text-center mb-6 transition-all duration-700 ${isUnlocked ? 'opacity-0 -translate-y-4' : 'opacity-100'}`}>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border text-xs tracking-wider uppercase mb-3 shadow-lg ${
          theme?.isDark
            ? 'bg-white/10 border-white/15 text-amber-200'
            : 'bg-white/80 border-amber-900/20 text-amber-900 shadow-amber-900/5'
        }`}>
          <Sparkles size={13} className={theme?.isDark ? 'text-amber-300 animate-pulse' : 'text-amber-600 animate-pulse'} />
          <span>Lá Thư Dành Riêng Cho Bạn</span>
        </div>

        <h1 className={`text-3xl md:text-4xl font-serif font-bold tracking-wide drop-shadow-md mb-2 ${
          theme?.isDark ? 'text-white' : 'text-neutral-900'
        }`}>
          Gửi {recipientName}
        </h1>

        <p className={`italic text-sm md:text-base max-w-md mx-auto px-2 font-serif font-light leading-relaxed ${
          theme?.isDark ? 'text-neutral-300' : 'text-neutral-700'
        }`}>
          "{introQuote}"
        </p>
      </div>

      {/* KHỐI PHONG BÌ 3D (3D Envelope Container) */}
      <div className="relative w-full max-w-[360px] sm:max-w-[420px] aspect-[1.45/1] mx-auto filter drop-shadow-2xl">

        {/* Lớp nền trong lòng phong bì (Interior) */}
        <div className={`absolute inset-0 rounded-xl ${env.inner || 'bg-[#ffe4e6]'} shadow-inner overflow-hidden border ${env.border || 'border-amber-300/80'}`}>
          {/* Họa tiết lót phong bì */}
          <div className="w-full h-full opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
        </div>

        {/* Lá thư bên trong đang trồi lên (Paper sliding out) */}
        <div 
          className={`absolute left-4 right-4 bottom-2 bg-[#faf6ed] rounded-lg shadow-xl p-5 border border-amber-800/20 transition-all duration-1000 ease-out z-10 ${
            letterRising 
              ? '-translate-y-40 scale-105 opacity-100 shadow-2xl' 
              : 'translate-y-0 opacity-80'
          }`}
          style={{ height: '85%' }}
        >
          {/* Nội dung thu nhỏ của lá thư nhìn qua khe phong bì */}
          <div className="w-full h-full flex flex-col justify-between border border-dashed border-amber-900/25 p-3 rounded">
            <div className="flex items-center justify-between border-b border-amber-900/20 pb-2">
              <span className="font-handwriting text-xl text-amber-950 font-bold">Thư riêng gửi {recipientName}</span>
              <Heart size={14} className="text-rose-500 fill-rose-500" />
            </div>
            <div className="space-y-2 py-2">
              <div className="h-2 bg-amber-900/20 rounded w-5/6" />
              <div className="h-2 bg-amber-900/15 rounded w-4/6" />
              <div className="h-2 bg-amber-900/20 rounded w-full" />
            </div>
            <div className="text-right text-[11px] font-serif text-amber-900/60 italic">
              Nhấp mở để đọc tiếp...
            </div>
          </div>
        </div>

        {/* 2 Cánh gập trái & phải của phong bì (Side Flaps) */}
        <div 
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            clipPath: 'polygon(0 0, 50% 50%, 0 100%)',
            background: `linear-gradient(135deg, rgba(255,255,255,0.12), transparent 40%), ${env.sideFlap || '#8B1E1E'}`
          }}
        />

        <div 
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            clipPath: 'polygon(100% 0, 50% 50%, 100% 100%)',
            background: `linear-gradient(-135deg, rgba(255,255,255,0.12), transparent 40%), ${env.sideFlap || '#7d1818'}`
          }}
        />

        {/* Cánh gập dưới của phong bì (Bottom Flap) */}
        <div 
          className="absolute inset-0 rounded-b-xl pointer-events-none z-20"
          style={{
            clipPath: 'polygon(0 100%, 50% 48%, 100% 100%)',
            background: `linear-gradient(0deg, rgba(0,0,0,0.15), transparent 60%), ${env.bottomFlap || '#8B1E1E'}`
          }}
        />

        {/* Cánh gập trên có thể lật mở (Top Flap with 3D hinge) */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1/2 origin-top transition-transform duration-700 ease-in-out z-25 ${
            flapOpen ? '-rotate-x-180 z-5' : 'rotate-x-0 z-25'
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'top center',
            transform: flapOpen ? 'rotateX(180deg)' : 'rotateX(0deg)',
          }}
        >
          <div 
            className="w-full h-full rounded-t-xl"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              background: `linear-gradient(180deg, rgba(255,255,255,0.2), transparent 45%), ${env.topFlap || '#a32525'}`
            }}
          />
        </div>

        {/* Con dấu sáp niêm phong trang trọng (Wax Seal) */}
        {!flapOpen && (
          <div 
            onClick={onUnlockClick}
            className={`absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group transition-all duration-300 ${
              sealCracked ? 'scale-125 opacity-0' : 'scale-100 hover:scale-105 active:scale-95'
            }`}
          >
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${getSealClass(env.sealType)} border-2 border-white/20 shadow-2xl`}>
              <span className="text-xl sm:text-2xl drop-shadow-md select-none transform transition-transform group-hover:rotate-12">
                {env.sealSymbol || '✉️'}
              </span>
            </div>
            
            {/* Vòng sáng quanh con dấu */}
            <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md group-hover:bg-amber-400/40 transition-all animate-pulse" />
          </div>
        )}

      </div>

      {/* Nút bấm mở khóa phong bì */}
      {!isUnlocked && (
        <div className="mt-8 z-20">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClickSound();
              onUnlockClick();
            }}
            className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 font-semibold tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <Lock size={18} className="transition-transform group-hover:-translate-y-0.5" />
            <span className="text-base font-serif font-bold">MỞ KHÓA LÁ THƯ</span>
            <Sparkles size={16} className="text-neutral-900 animate-spin" style={{ animationDuration: '4s' }} />
          </button>
        </div>
      )}

      {/* Chú thích gợi ý */}
      {!isUnlocked && (
        <p className="text-xs text-neutral-400 mt-4 text-center">
          Nhấp vào con dấu hoặc nút mở khóa để đọc tâm thư 💌
        </p>
      )}

    </div>
  );
}
