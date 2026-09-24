import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Shield,
  ShieldCheck,
  ArrowLeft,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Mail
} from 'lucide-react';
import { getTheme, THEME_LIST } from '../types/theme';
import ParticleCanvas from '../canvas/ParticleCanvas';
import FloatingBubbles from '../components/FloatingBubbles';
import MultiTierLockFlow from '../components/MultiTierLockFlow';
import Envelope3D from '../components/Envelope3D';
import LetterReader from '../components/LetterReader';
import ReadingToolbar from '../components/ReadingToolbar';
import UserAvatar from '../components/UserAvatar';
import { soundEngine } from '../audio/soundEngine';

export default function Home() {
  // 1. Chế độ Nền Sáng / Nền Tối (Mặc định: false -> NỀN SÁNG BAN ĐẦU)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 2. Chủ đề đang chọn (null: Đang ở màn hình 4 Bong Bóng Nổi)
  const [selectedTheme, setSelectedTheme] = useState(null);

  // 3. Lá thư đã mở khóa qua Khóa 2
  const [unlockedLetter, setUnlockedLetter] = useState(null);
  const [isAnimationDone, setIsAnimationDone] = useState(false);

  // 4. Tùy chỉnh chế độ đọc thư
  const [fontSize, setFontSize] = useState('base');
  const [isDarkPaper, setIsDarkPaper] = useState(false);
  const [particlesActive, setParticlesActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);

  // 5. Phiên đăng nhập người dùng hiện tại
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('member_user') || 'null');
    } catch {
      return null;
    }
  });
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('admin_token') || '');

  // TỰ ĐỘNG PHÁT NGẪU NHIÊN 1 TRONG 4 BÀI NHẠC Ở MÀN HÌNH CHỜ
  useEffect(() => {
    if (!selectedTheme && !unlockedLetter) {
      soundEngine.playRandomTrack();

      // Nếu trình duyệt chặn do chính sách autoplay, bắt tương tác chạm đầu tiên
      const handleFirstInteraction = () => {
        if (!soundEngine.isPlaying && !selectedTheme && !unlockedLetter) {
          soundEngine.playRandomTrack();
        }
      };

      window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
      window.addEventListener('keydown', handleFirstInteraction, { once: true });

      return () => {
        window.removeEventListener('pointerdown', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
      };
    }
  }, [selectedTheme, unlockedLetter]);

  // CHUYỂN ĐỔI CHẾ ĐỘ NỀN SÁNG / NỀN TỐI (TOUCH BUTTON)
  const handleToggleDarkMode = () => {
    soundEngine.playClickSound();
    setIsDarkMode(prev => {
      const next = !prev;
      setIsDarkPaper(next);
      return next;
    });
  };

  // ĐIỀU CHỈNH ÂM LƯỢNG LỚN / NHỎ
  const handleVolumeChange = (newVal) => {
    const v = parseFloat(newVal);
    setVolume(v);
    soundEngine.setVolume(v);
    if (v > 0 && isMuted) {
      soundEngine.toggleMute();
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleLogout = () => {
    soundEngine.playClickSound();
    localStorage.removeItem('member_token');
    localStorage.removeItem('member_user');
    localStorage.removeItem('admin_token');
    setCurrentUser(null);
    setAdminToken('');
  };

  // KHI NGƯỜI DÙNG CHỌN CHỦ ĐỀ TỪ BONG BÓNG
  const handleSelectTheme = (theme) => {
    setSelectedTheme(theme);
    // Tự động phát bài hát MP3 tương ứng ngay khi ấn vào chủ đề
    if (theme.defaultMusic) {
      soundEngine.startBackgroundMusic({ track: theme.defaultMusic, defaultVolume: volume });
    }
    if (unlockedLetter) {
      setUnlockedLetter(prev => prev ? { ...prev, theme: theme.id } : null);
    }
  };

  // KHI ĐÃ VƯỢT QUA KHÓA 2 VÀ MỞ THÀNH CÔNG LÁ THƯ
  const handleLetterUnlocked = (letter) => {
    setUnlockedLetter(letter);
    if (letter.music) {
      soundEngine.startBackgroundMusic(letter.music);
    } else if (selectedTheme?.defaultMusic) {
      soundEngine.startBackgroundMusic({ track: selectedTheme.defaultMusic, defaultVolume: volume });
    }
  };

  // QUAY LẠI MÀN HÌNH BONG BÓNG CHÍNH
  const handleBackToMainBubbles = () => {
    soundEngine.playClickSound();
    setSelectedTheme(null);
    setUnlockedLetter(null);
    setIsAnimationDone(false);
    soundEngine.playRandomTrack();
  };

  // QUAY LẠI DANH SÁCH CHIẾC KHÓA
  const handleBackToKeys = () => {
    soundEngine.playClickSound();
    soundEngine.stopBackgroundMusic();
    setUnlockedLetter(null);
    setIsAnimationDone(false);
  };

  // Theme hiện tại thích ứng theo isDarkMode
  const currentTheme = selectedTheme ? getTheme(selectedTheme.id, isDarkMode) : null;

  return (
    <div
      className={`min-h-[100dvh] relative flex flex-col transition-colors duration-700 ${
        currentTheme
          ? isAnimationDone
            ? `bg-gradient-to-b ${currentTheme.readBgGradient}`
            : `bg-gradient-to-b ${currentTheme.bgGradient}`
          : isDarkMode
            ? 'bg-gradient-to-b from-[#090b10] via-[#10141f] to-[#090b10]'
            : 'bg-gradient-to-b from-[#faf8f5] via-[#f5efe6] to-[#ebe3d3]'
      } ${isDarkMode ? 'text-neutral-100' : 'text-neutral-900'} overflow-x-hidden`}
    >
      {/* 1. HIỆU ỨNG HẠT CANVAS */}
      <ParticleCanvas
        particleType={currentTheme ? currentTheme.particleType : 'petals'}
        active={particlesActive}
      />

      {/* 2. THANH HEADER ĐIỀU HƯỚNG & TOUCH BUTTON SÁNG / TỐI */}
      <header className={`relative z-40 w-full max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between transition-colors ${
        isDarkMode 
          ? 'border-b border-white/10 bg-neutral-950/40 backdrop-blur-md' 
          : 'border-b border-neutral-900/10 bg-white/70 backdrop-blur-md shadow-xs'
      }`}>
        <div 
          onClick={handleBackToMainBubbles}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
        >
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform ${
            isDarkMode 
              ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' 
              : 'bg-amber-100 border border-amber-300 text-amber-700'
          }`}>
            <Sparkles size={18} />
          </div>
          <div>
            <span className={`font-serif font-bold text-sm sm:text-base block leading-tight ${
              isDarkMode ? 'text-white' : 'text-neutral-900'
            }`}>
              Secret Letter
            </span>
            <span className={`text-[9px] sm:text-[10px] font-sans tracking-wider uppercase block ${
              isDarkMode ? 'text-amber-400' : 'text-amber-700'
            }`}>
              Lá Thư Kỹ Thuật Số
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* TOUCH BUTTON CHUYỂN ĐỔI: NỀN SÁNG ☀️ / NỀN TỐI 🌙 */}
          <button
            type="button"
            onClick={handleToggleDarkMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs font-sans font-medium transition-all shadow-xs cursor-pointer ${
              isDarkMode
                ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-400/30'
                : 'bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 shadow-xs'
            }`}
            title={isDarkMode ? 'Chạm để chuyển sang Nền Sáng ☀️' : 'Chạm để chuyển sang Nền Tối 🌙'}
          >
            {isDarkMode ? (
              <>
                <Moon size={14} className="text-sky-300" />
                <span className="hidden xs:inline">Nền Tối</span>
              </>
            ) : (
              <>
                <Sun size={14} className="text-amber-500" />
                <span className="hidden xs:inline">Nền Sáng</span>
              </>
            )}
          </button>

          {/* BỘ ĐIỀU CHỈNH ÂM LƯỢNG (Volume Slider & Mute Toggle) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDarkMode
                  ? 'bg-white/5 hover:bg-white/10 text-amber-400 border border-white/10'
                  : 'bg-white/80 hover:bg-white text-amber-700 border border-neutral-300 shadow-xs'
              }`}
              title={isMuted ? 'Đang tắt âm thanh (Chạm để bật)' : 'Bật/Tắt âm thanh'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="animate-pulse" />}
            </button>

            {/* Thanh trượt âm lượng trên desktop & tablet */}
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
              isDarkMode ? 'bg-neutral-900/80 border border-white/10' : 'bg-white/90 border border-neutral-200 shadow-xs'
            }`}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(e.target.value)}
                className="w-16 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
              <span className={`text-[10px] font-mono w-7 text-right ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>

          {/* CỔNG ĐĂNG NHẬP / PROFILE NGƯỜI DÙNG */}
          {!currentUser && !adminToken ? (
            <Link
              to="/login"
              onClick={() => soundEngine.playClickSound()}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-serif font-bold transition-all shadow-xs cursor-pointer ${
                isDarkMode
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-xs'
              }`}
              title="Đăng nhập tài khoản"
            >
              <LogIn size={14} />
              <span>Đăng Nhập</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {adminToken || currentUser?.role === 'admin' ? (
                <Link
                  to="/admin"
                  onClick={() => soundEngine.playClickSound()}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-serif font-bold transition-all ${
                    isDarkMode
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      : 'bg-amber-500 text-neutral-950 shadow-xs'
                  }`}
                  title="Vào bảng quản trị Admin"
                >
                  <ShieldCheck size={14} />
                  <span>Quản Trị</span>
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  onClick={() => soundEngine.playClickSound()}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-serif font-bold transition-all ${
                    isDarkMode
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      : 'bg-amber-500 text-neutral-950 shadow-xs'
                  }`}
                  title="Vào hòm thư cá nhân"
                >
                  <UserAvatar avatar={currentUser?.avatar} size="sm" />
                  <span className="hidden xs:inline">{currentUser?.displayName || currentUser?.username}</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className={`p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                    : 'border-neutral-200 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 shadow-xs'
                }`}
                title="Đăng xuất"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 3. KHU VỰC NỘI DUNG TƯƠNG TÁC */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center w-full">
        
        {/* MÀN HÌNH CHÍNH: 4 QUẢ BONG BÓNG NỔI (TẾT, SINH NHẬT, NGỌT NGÀO, TÂM TÌNH) */}
        {!selectedTheme && (
          <FloatingBubbles 
            onSelectTheme={handleSelectTheme} 
            isDark={isDarkMode}
          />
        )}

        {/* MÀN HÌNH KHÓA ĐA TẦNG: KHÓA 1 (ĐỊNH DANH) & KHÓA 2 (CHỌN KHÓA MỞ THƯ) */}
        {selectedTheme && !unlockedLetter && (
          <MultiTierLockFlow
            theme={currentTheme}
            isDark={isDarkMode}
            onBackToThemes={handleBackToMainBubbles}
            onLetterUnlocked={handleLetterUnlocked}
            onToggleDark={handleToggleDarkMode}
          />
        )}

        {/* MÀN HÌNH MỞ PHONG BÌ 3D & ĐỌC THƯ */}
        {selectedTheme && unlockedLetter && (
          <div className="w-full flex-1 flex flex-col items-center justify-center py-4 sm:py-6">
            
            {/* THANH ĐIỀU KHIỂN TRÊN ĐẦU LÁ THƯ */}
            <div className="w-full max-w-3xl px-4 mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleBackToKeys}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans backdrop-blur-md transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-neutral-900/80 hover:bg-neutral-800 text-amber-300 border border-amber-400/30'
                    : 'bg-white/85 hover:bg-white text-neutral-800 hover:text-neutral-950 border border-neutral-300 shadow-xs'
                }`}
              >
                <ArrowLeft size={14} />
                <span>Chọn khóa khác</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleDarkMode}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                    isDarkMode
                      ? 'bg-neutral-800 text-amber-300 border border-amber-400/30'
                      : 'bg-white text-neutral-800 border border-neutral-300 shadow-xs'
                  }`}
                >
                  {isDarkMode ? <Moon size={13} className="text-sky-300" /> : <Sun size={13} className="text-amber-500" />}
                  <span>{isDarkMode ? 'Nền Tối' : 'Nền Sáng'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBackToMainBubbles}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans backdrop-blur-md transition-all cursor-pointer ${
                    isDarkMode
                      ? 'bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white border border-white/15'
                      : 'bg-white/80 hover:bg-white text-neutral-700 hover:text-neutral-950 border border-neutral-300 shadow-xs'
                  }`}
                >
                  <span>🫧 Về chủ đề</span>
                </button>
              </div>
            </div>

            {!isAnimationDone ? (
              // HOẠT ẢNH PHONG BÌ 3D
              <Envelope3D
                recipientName={unlockedLetter.recipientName}
                introQuote={unlockedLetter.introQuote}
                theme={currentTheme}
                isUnlocked={true}
                onUnlockClick={() => {}}
                onAnimationComplete={() => setIsAnimationDone(true)}
              />
            ) : (
              // TRÌNH ĐỌC THƯ
              <div className="w-full animate-fade-in">
                <LetterReader
                  letter={unlockedLetter}
                  theme={currentTheme}
                  fontSize={fontSize}
                  isDarkPaper={isDarkPaper}
                />
              </div>
            )}
          </div>
        )}

      </main>

      {/* 4. THANH CÔNG CỤ CHẾ ĐỘ ĐỌC KHI ĐANG ĐỌC THƯ */}
      {selectedTheme && unlockedLetter && isAnimationDone && (
        <ReadingToolbar
          fontSize={fontSize}
          setFontSize={setFontSize}
          isDarkPaper={isDarkPaper}
          setIsDarkPaper={setIsDarkPaper}
          particlesActive={particlesActive}
          setParticlesActive={setParticlesActive}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onThemeChange={(newThemeId) => {
            const found = THEME_LIST.find((t) => t.id === newThemeId);
            if (found) handleSelectTheme(found);
          }}
          currentThemeId={selectedTheme.id}
        />
      )}

      {/* FOOTER TỐI GIẢN & CHUYỂN NHANH 3 GIAO DIỆN */}
      <footer className={`relative z-20 border-t py-4 text-center text-xs font-sans transition-colors ${
        isDarkMode ? 'border-white/8 text-neutral-500' : 'border-neutral-900/10 text-neutral-600'
      }`}>
        <div className="flex items-center justify-center gap-3 text-[11px] mb-1">
          <Link to="/" className="hover:underline font-medium">Trang Chủ (Công Khai)</Link>
          <span>•</span>
          <Link to="/dashboard" className="hover:underline font-medium text-amber-600 dark:text-amber-400">Gửi Thư (Thành Viên)</Link>
          <span>•</span>
          <Link to="/admin" className="hover:underline font-medium">Quản Trị Hệ Thống (Admin)</Link>
        </div>
        <p className="text-[10px] opacity-75">Digital Secret Letter • Hòm Thư Bí Mật Dành Riêng Cho Bạn</p>
      </footer>

    </div>
  );
}
