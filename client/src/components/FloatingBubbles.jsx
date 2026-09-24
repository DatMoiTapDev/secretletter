import React from 'react';
import { Sparkles } from 'lucide-react';
import { THEME_LIST } from '../types/theme';
import { soundEngine } from '../audio/soundEngine';

export default function FloatingBubbles({ onSelectTheme, isDark = false }) {
  // Cấu hình nhịp trôi và hiệu ứng riêng cho 4 chủ đề
  const bubbleConfigs = {
    tet: {
      delay: '0s',
      duration: '7.0s',
      lightGlow: 'hover:shadow-[0_12px_40px_rgba(239,68,68,0.2)] hover:border-rose-300',
      darkGlow: 'hover:shadow-[0_12px_40px_rgba(239,68,68,0.3)] hover:border-rose-400/50'
    },
    birthday: {
      delay: '0.8s',
      duration: '7.8s',
      lightGlow: 'hover:shadow-[0_12px_40px_rgba(245,158,11,0.22)] hover:border-amber-300',
      darkGlow: 'hover:shadow-[0_12px_40px_rgba(251,191,36,0.3)] hover:border-amber-400/50'
    },
    cute: {
      delay: '0.4s',
      duration: '8.2s',
      lightGlow: 'hover:shadow-[0_12px_40px_rgba(236,72,153,0.2)] hover:border-pink-300',
      darkGlow: 'hover:shadow-[0_12px_40px_rgba(244,114,182,0.3)] hover:border-pink-400/50'
    },
    emotional: {
      delay: '1.2s',
      duration: '8.6s',
      lightGlow: 'hover:shadow-[0_12px_40px_rgba(2,132,199,0.2)] hover:border-sky-300',
      darkGlow: 'hover:shadow-[0_12px_40px_rgba(56,189,248,0.3)] hover:border-sky-400/50'
    }
  };

  const handleBubbleClick = (theme) => {
    soundEngine.playUnlockSound();
    onSelectTheme(theme);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 py-4 sm:py-8 flex flex-col items-center justify-center min-h-[calc(100dvh-130px)] select-none">
      
      {/* TIÊU ĐỀ TỐI GIẢN & THANH LỊCH */}
      <div className="text-center mb-6 sm:mb-10 z-20">
        <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-sans tracking-wide mb-2 sm:mb-3 backdrop-blur-md shadow-xs transition-colors ${
          isDark 
            ? 'bg-white/[0.06] border border-white/10 text-neutral-300' 
            : 'bg-white/80 border border-neutral-200 text-neutral-700 shadow-sm'
        }`}>
          <Sparkles size={13} className={isDark ? 'text-amber-300' : 'text-amber-600'} />
          <span>Hòm Thư Bí Mật</span>
        </div>

        <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-serif font-normal tracking-tight leading-tight transition-colors ${
          isDark ? 'text-white' : 'text-neutral-900'
        }`}>
          Chọn Một <span className={`italic font-serif ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>Chủ Đề</span>
        </h1>

        <p className={`text-xs sm:text-sm font-sans mt-2 max-w-sm sm:max-w-md mx-auto leading-relaxed transition-colors ${
          isDark ? 'text-neutral-400' : 'text-neutral-600'
        }`}>
          Chạm vào bong bóng để mở lá thư riêng tư của bạn
        </p>
      </div>

      {/* LƯỚI 4 BONG BÓNG: FIT 2x2 TRÊN MOBILE VÀ 4 CỘT TRÊN DESKTOP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 items-center justify-center z-20 w-full max-w-4xl px-2">
        {THEME_LIST.map((theme) => {
          const config = bubbleConfigs[theme.id] || {
            delay: '0s',
            duration: '7.5s',
            lightGlow: '',
            darkGlow: ''
          };

          return (
            <div
              key={theme.id}
              onClick={() => handleBubbleClick(theme)}
              className="flex flex-col items-center justify-center group cursor-pointer"
            >
              {/* QUẢ BONG BÓNG THỦY TINH NỔI */}
              <div
                className={`relative w-28 h-28 xs:w-32 xs:h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full flex flex-col items-center justify-center p-2.5 xs:p-3 sm:p-4 transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-1.5 active:scale-95 ${
                  isDark
                    ? `bg-white/[0.05] hover:bg-white/[0.1] border border-white/12 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl ${config.darkGlow}`
                    : `bg-white/80 hover:bg-white/95 border border-white/80 shadow-[0_10px_35px_rgba(0,0,0,0.06)] backdrop-blur-xl ${config.lightGlow}`
                }`}
                style={{
                  animation: `float ${config.duration} ease-in-out infinite`,
                  animationDelay: config.delay
                }}
              >
                {/* Vệt phản chiếu ánh kính bóng (Glass specular highlight) */}
                <div className={`absolute top-2.5 left-3.5 sm:left-4 w-7 xs:w-8 sm:w-11 h-3.5 xs:h-4 sm:h-5 rounded-full transform -rotate-45 pointer-events-none ${
                  isDark 
                    ? 'bg-gradient-to-b from-white/35 to-transparent' 
                    : 'bg-gradient-to-b from-white/90 to-white/10'
                }`} />

                {/* Điểm sáng phụ dưới góc */}
                <div className="absolute bottom-2.5 right-2.5 xs:bottom-3 xs:right-3 sm:right-4 w-2.5 xs:w-3 sm:w-4 h-1.5 sm:h-2 rounded-full bg-white/20 blur-xs pointer-events-none" />

                {/* Hạt bụi sáng mịn bên trong */}
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

                {/* Biểu tượng Emoji */}
                <span className="text-2xl xs:text-3xl sm:text-4xl mb-1 xs:mb-2 filter drop-shadow-sm transform transition-transform duration-300 group-hover:scale-115">
                  {theme.emoji}
                </span>

                {/* Tên Chủ Đề Ngắn Gọn: Tết / Sinh nhật / Yêu / Tâm tình */}
                <span className={`font-serif text-xs xs:text-sm sm:text-base text-center leading-tight tracking-wide transition-colors px-1 ${
                  isDark
                    ? 'font-medium text-neutral-100 group-hover:text-amber-200'
                    : 'font-semibold text-neutral-900 group-hover:text-amber-800'
                }`}>
                  {theme.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHÚ THÍCH BẢO MẬT GỌN GÀNG DƯỚI CÙNG */}
      <div className="mt-8 sm:mt-12 text-center z-20">
        <p className={`text-[11px] sm:text-xs font-sans tracking-wide transition-colors ${
          isDark ? 'text-neutral-400' : 'text-neutral-500'
        }`}>
          🔒 Khóa bảo mật 2 tầng • Mọi lá thư đồng bộ trọn vẹn
        </p>
      </div>

    </div>
  );
}
