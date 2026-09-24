import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Shield,
  Volume2,
  VolumeX,
  RotateCcw,
  X,
  Home,
  Palette,
  Sun,
  Moon
} from 'lucide-react';
import { getTheme } from '../types/theme';
import ParticleCanvas from '../canvas/ParticleCanvas';
import Envelope3D from '../components/Envelope3D';
import PasswordModal from '../components/PasswordModal';
import LetterReader from '../components/LetterReader';
import ReadingToolbar from '../components/ReadingToolbar';
import { NotFoundLetterScreen, ExpiredLetterScreen, NetworkErrorScreen } from '../components/ErrorScreens';
import { soundEngine } from '../audio/soundEngine';

export default function RecipientView({ previewData = null }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // State quản lý giao diện sáng / tối & âm lượng
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [volume, setVolume] = useState(0.4);

  // State quản lý dữ liệu
  const [loading, setLoading] = useState(!previewData);
  const [meta, setMeta] = useState(previewData ? { ...previewData, hasPassword: Boolean(previewData.hasPassword) } : null);
  const [unlockedLetter, setUnlockedLetter] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  // State hiệu ứng mở khóa
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAnimationDone, setIsAnimationDone] = useState(false);

  // State tùy chỉnh đọc thư
  const [overrideThemeId, setOverrideThemeId] = useState(null);
  const [fontSize, setFontSize] = useState('base');
  const [isDarkPaper, setIsDarkPaper] = useState(false);
  const [particlesActive, setParticlesActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Tải metadata từ API khi người nhận truy cập
  const fetchMeta = async () => {
    if (previewData) return;
    setLoading(true);
    setErrorCode(null);
    try {
      const res = await fetch(`/api/letters/${id}/meta`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) setErrorCode('NOT_FOUND');
        else if (res.status === 410) setErrorCode('EXPIRED');
        else setErrorCode('ERROR');
        return;
      }

      setMeta(data.meta);
      // Khởi tạo chế độ nền giấy theo theme
      if (data.meta.theme === 'emotional' || data.meta.theme === 'minimal') {
        setIsDarkPaper(true);
      }
    } catch (err) {
      console.error('Lỗi khi tải metadata thư:', err);
      setErrorCode('NETWORK');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
    return () => {
      soundEngine.stopBackgroundMusic();
    };
  }, [id]);

  // Xử lý mở khóa bằng mật khẩu
  const handleUnlockSubmit = async (enteredPassword) => {
    setIsUnlocking(true);
    setPasswordError('');

    // Nếu đang ở chế độ xem trước (preview trong Admin)
    if (previewData) {
      setTimeout(() => {
        if (previewData.password && enteredPassword !== previewData.password) {
          setPasswordError('Hình như chưa đúng rồi... thử lại nhé 💌');
          setIsUnlocking(false);
          return;
        }
        completeUnlock(previewData);
      }, 500);
      return;
    }

    try {
      const res = await fetch(`/api/letters/${id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: enteredPassword })
      });

      const result = await res.json();

      if (!res.ok) {
        setPasswordError(result.message || 'Hình như chưa đúng rồi... thử lại nhé 💌');
        setIsUnlocking(false);
        return;
      }

      completeUnlock(result.data);
    } catch (err) {
      console.error('Lỗi khi mở khóa thư:', err);
      setPasswordError('Có lỗi xảy ra khi kết nối máy chủ, thử lại nhé.');
      setIsUnlocking(false);
    }
  };

  // Hoàn tất xác thực và khởi chạy hoạt ảnh mở thư
  const completeUnlock = (letterData) => {
    setUnlockedLetter(letterData);
    setIsPasswordModalOpen(false);
    setIsUnlocking(false);
    setIsUnlocked(true);

    // Kích hoạt phát nhạc nền fade-in
    if (letterData.music) {
      soundEngine.startBackgroundMusic(letterData.music);
    }
  };

  // Khi click vào mở khóa phong bì
  const handleOpenEnvelopeClick = () => {
    if (meta && !meta.hasPassword) {
      // Thư không có mật khẩu -> Mở trực tiếp
      handleUnlockSubmit('');
    } else {
      setIsPasswordModalOpen(true);
    }
  };

  // Quay lại tác vụ trước hoặc về trang chính
  const handleBack = () => {
    soundEngine.playClickSound();
    soundEngine.stopBackgroundMusic();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Đóng thư để xem lại phong bì
  const handleReopenEnvelope = () => {
    soundEngine.playClickSound();
    setIsAnimationDone(false);
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Các màn hình trạng thái lỗi
  if (errorCode === 'NOT_FOUND') return <NotFoundLetterScreen />;
  if (errorCode === 'EXPIRED') return <ExpiredLetterScreen expiresAt={meta?.expiresAt} />;
  if (errorCode === 'NETWORK') return <NetworkErrorScreen onRetry={fetchMeta} />;

  // Màn hình loading ban đầu
  if (loading || !meta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-300">
        <div className="w-12 h-12 border-3 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mb-4" />
        <p className="font-serif italic text-sm text-neutral-400 animate-pulse">
          Đang chuẩn bị phong bì gửi tới bạn...
        </p>
      </div>
    );
  }

  const currentTheme = getTheme(overrideThemeId || meta.theme, isDarkMode);
  const isDark = isDarkMode;

  return (
    <div
      className={`min-h-screen relative flex flex-col transition-colors duration-1000 bg-gradient-to-b ${
        isAnimationDone ? currentTheme.readBgGradient : currentTheme.bgGradient
      }`}
    >
      {/* 1. Hệ thống hiệu ứng hạt Canvas theo Theme */}
      <ParticleCanvas
        particleType={currentTheme.particleType}
        active={particlesActive}
      />

      {/* 2. Thanh điều hướng / Thanh tắt trở lại tác vụ */}
      {!previewData && (
        <header className={`relative z-40 w-full max-w-5xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between transition-colors ${
          isDark ? '' : 'text-neutral-900'
        }`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-serif backdrop-blur-md shadow-lg transition-all cursor-pointer group ${
                isDark
                  ? 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-white/15'
                  : 'bg-white/85 hover:bg-white text-neutral-800 hover:text-neutral-950 border border-neutral-300'
              }`}
              title="Quay lại tác vụ trước"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Trở lại</span>
            </button>

            <Link
              to="/"
              onClick={() => soundEngine.stopBackgroundMusic()}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-serif backdrop-blur-md transition-all ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white border border-white/10'
                  : 'bg-white/80 hover:bg-white text-neutral-700 hover:text-neutral-950 border border-neutral-200 shadow-xs'
              }`}
              title="Về trang chủ Bong Bóng Nổi"
            >
              <Home size={13} />
              <span className="hidden sm:inline">Trang Chủ</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Touch Button Nền Sáng / Nền Tối */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                setIsDarkMode(!isDarkMode);
                setIsDarkPaper(!isDarkMode);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-neutral-800 text-amber-300 border border-amber-400/30'
                  : 'bg-white text-neutral-800 border border-neutral-300 shadow-xs'
              }`}
              title={isDark ? 'Chạm để sang Nền Sáng ☀️' : 'Chạm để sang Nền Tối 🌙'}
            >
              {isDark ? <Moon size={13} className="text-sky-300" /> : <Sun size={13} className="text-amber-500" />}
              <span>{isDark ? 'Nền Tối' : 'Nền Sáng'}</span>
            </button>

            {/* Tên người nhận tinh tế */}
            {meta?.recipientName && (
              <div className={`hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] font-serif ${
                isDark
                  ? 'bg-amber-500/10 border-amber-400/20 text-amber-300'
                  : 'bg-amber-100/90 border-amber-300/80 text-amber-900'
              }`}>
                <span>💌 Gửi {meta.recipientName}</span>
              </div>
            )}

            {/* Nút bật/tắt nhanh âm thanh */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-amber-400 border border-white/10'
                  : 'bg-white/80 hover:bg-white text-amber-600 border border-neutral-200 shadow-xs'
              }`}
              title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="animate-pulse" />}
            </button>

            {/* Nút Creator Studio */}
            <Link
              to="/admin"
              onClick={() => soundEngine.stopBackgroundMusic()}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-serif transition-all ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white border border-white/15'
                  : 'bg-white/80 hover:bg-white text-neutral-800 hover:text-neutral-950 border border-neutral-200 shadow-xs'
              }`}
              title="Vào bảng quản trị Creator Studio"
            >
              <Shield size={13} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
              <span className="hidden sm:inline">Creator Studio</span>
            </Link>
          </div>
        </header>
      )}

      {/* 3. Giao diện chính */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center">
        {!isAnimationDone ? (
          // Màn hình 1: Phong bì thư 3D tương tác
          <div className="w-full flex-1 flex items-center justify-center">
            <Envelope3D
              recipientName={meta.recipientName}
              introQuote={meta.introQuote}
              theme={currentTheme}
              isUnlocked={isUnlocked}
              onUnlockClick={handleOpenEnvelopeClick}
              onAnimationComplete={() => setIsAnimationDone(true)}
            />
          </div>
        ) : (
          // Màn hình 2: Trình đọc lá thư đã mở với nội dung cuộn mượt mà
          <div className="w-full animate-fade-in flex flex-col items-center">
            {/* Thanh điều khiển phụ khi đang đọc thư */}
            <div className="w-full max-w-3xl px-4 pt-2 pb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReopenEnvelope}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-serif backdrop-blur-md transition-all cursor-pointer ${
                  isDark
                    ? 'bg-neutral-900/80 hover:bg-neutral-800 text-amber-300 border border-amber-400/30'
                    : 'bg-white/85 hover:bg-white text-neutral-800 hover:text-neutral-950 border border-neutral-300 shadow-sm'
                }`}
                title="Khép lại để xem phong bì"
              >
                <RotateCcw size={13} />
                <span>Khép lại phong bì</span>
              </button>

              <button
                type="button"
                onClick={handleBack}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-serif backdrop-blur-md transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white border border-white/15'
                    : 'bg-white/85 hover:bg-white text-neutral-700 hover:text-neutral-950 border border-neutral-300 shadow-sm'
                }`}
                title="Đóng thư và trở lại tác vụ trước"
              >
                <X size={13} />
                <span>Đóng & Trở lại tác vụ</span>
              </button>
            </div>

            <LetterReader
              letter={unlockedLetter}
              theme={currentTheme}
              fontSize={fontSize}
              isDarkPaper={isDarkPaper}
            />
          </div>
        )}
      </main>

      {/* 3. Modal nhập mật khẩu */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handleUnlockSubmit}
        isLoading={isUnlocking}
        errorMsg={passwordError}
        passwordHint={meta.passwordHint}
      />

      {/* 4. Thanh công cụ tùy chỉnh đọc thư (chỉ hiển thị khi đã mở thư) */}
      {isAnimationDone && (
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
          onVolumeChange={(val) => {
            const v = parseFloat(val);
            setVolume(v);
            soundEngine.setVolume(v);
          }}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => {
            setIsDarkMode(!isDarkMode);
            setIsDarkPaper(!isDarkMode);
          }}
          onThemeChange={(newTheme) => setOverrideThemeId(newTheme)}
          currentThemeId={overrideThemeId || meta.theme}
        />
      )}
    </div>
  );
}
