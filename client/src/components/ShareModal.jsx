import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Download, QrCode as QrIcon, Share2, Sparkles, ArrowLeft, ExternalLink } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export default function ShareModal({ letter, isOpen, onClose }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  
  // Trạng thái cửa sổ: Thu nhỏ (minimized) và Phóng to (maximized)
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const letterUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/letter/${letter?.slug || letter?.id}`
    : `https://.../letter/${letter?.slug || letter?.id}`;

  const messageTemplate = `💌 Gửi ${letter?.recipientName || 'bạn'},\n\nMình đã chuẩn bị một lá thư đặc biệt dành riêng cho bạn.\n👉 Mở thư tại đây: ${letterUrl}\n\n(Chúc bạn có những phút giây thật ấm áp!)`;

  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
      setIsMaximized(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && letter) {
      QRCode.toDataURL(letterUrl, {
        width: 340,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Lỗi tạo QR:', err));
    }
  }, [isOpen, letterUrl, letter]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !letter) return null;

  const handleCopyLink = () => {
    soundEngine.playClickSound();
    navigator.clipboard.writeText(letterUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessage = () => {
    soundEngine.playClickSound();
    navigator.clipboard.writeText(messageTemplate);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleDownloadQr = () => {
    soundEngine.playClickSound();
    const link = document.createElement('a');
    link.download = `QR-Thu-${letter.slug || letter.id}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  // ========================================================
  // CHẾ ĐỘ 1: THU NHỎ THÀNH THANH NỔI (MINIMIZED WIDGET)
  // ========================================================
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900/95 border border-amber-400/40 text-neutral-100 shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          {/* Nhấn vào để mở rộng lại */}
          <div
            onClick={() => {
              soundEngine.playClickSound();
              setIsMinimized(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer group pr-2 select-none"
            title="Nhấn để mở rộng lại cửa sổ QR"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-md">
              <QrIcon size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-serif font-bold text-white group-hover:text-amber-300 transition-colors">
                  Mã QR Thư 💌
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  ({letter.recipientName})
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 block font-serif">
                Đang thu nhỏ • Chạm để khôi phục
              </span>
            </div>
          </div>

          {/* Cụm 3 nút chuẩn: Thu nhỏ - Phóng to - Đóng */}
          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
            {/* Khôi phục kích thước chuẩn */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                setIsMinimized(false);
              }}
              className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Khôi phục kích thước chuẩn"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="2" y="2" width="12" height="12" rx="2" />
              </svg>
            </button>

            {/* Phóng to toàn màn hình */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                setIsMinimized(false);
                setIsMaximized(true);
              }}
              className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Phóng to toàn màn hình"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="1.5" y="4.5" width="10" height="10" rx="1.5" />
                <path d="M4.5 1.5H13C13.8284 1.5 14.5 2.17157 14.5 3V11.5" />
              </svg>
            </button>

            {/* Đóng */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                onClose();
              }}
              className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-rose-600 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // CHẾ ĐỘ 2 & 3: KÍCH THƯỚC CHUẨN HOẶC PHÓNG TO TOÀN MÀN HÌNH
  // ========================================================
  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundEngine.playClickSound();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto transition-all"
    >
      <div
        className={`relative w-full rounded-3xl bg-neutral-900 border border-white/20 text-neutral-100 shadow-[0_20px_70px_rgba(0,0,0,0.9)] transition-all duration-300 flex flex-col ${
          isMaximized
            ? 'w-[96vw] max-w-5xl h-[92vh] max-h-[92vh] p-6 sm:p-8 justify-between border-amber-400/40'
            : 'max-w-lg p-6 sm:p-7 space-y-5 my-auto'
        }`}
      >
        {/* THANH TIÊU ĐỀ TITLE BAR CÙNG 3 NÚT ĐIỀU KHIỂN CỬA SỔ (THU NHỎ - PHÓNG TO/KHÔI PHỤC - ĐÓNG) */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                <span>Chia Sẻ Lá Thư 💌</span>
                {isMaximized && (
                  <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-[11px] text-amber-300 font-mono">
                    Chế độ phóng to
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400">
                Gửi tới: <strong className="text-white">{letter.recipientName}</strong>
              </p>
            </div>
          </div>

          {/* CỤM 3 NÚT ĐIỀU KHIỂN CỬA SỔ THEO ĐÚNG HÌNH ẢNH MẪU */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shadow-inner">
            
            {/* Nút 1: Thu nhỏ (-) */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                setIsMinimized(true);
              }}
              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
              title="Thu nhỏ thành thanh nổi (-)"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" className="group-hover:scale-110 transition-transform">
                <path d="M2.5 8H13.5" />
              </svg>
            </button>

            {/* Nút 2: Phóng to / Thu lại kích thước chuẩn (❐ / □) */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                setIsMaximized(!isMaximized);
              }}
              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
              title={isMaximized ? "Khôi phục kích thước chuẩn (❐)" : "Phóng to toàn màn hình (□)"}
            >
              {isMaximized ? (
                /* Icon 2 ô xếp chồng (Restore / Khôi phục) */
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="group-hover:scale-110 transition-transform">
                  <rect x="1.5" y="4.5" width="10" height="10" rx="1.5" />
                  <path d="M4.5 1.5H13C13.8284 1.5 14.5 2.17157 14.5 3V11.5" />
                </svg>
              ) : (
                /* Icon 1 ô vuông (Maximize / Phóng to) */
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="group-hover:scale-110 transition-transform">
                  <rect x="2" y="2" width="12" height="12" rx="2" />
                </svg>
              )}
            </button>

            {/* Nút 3: Đóng (✕) */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-rose-600 transition-colors cursor-pointer group"
              title="Đóng cửa sổ (✕)"
            >
              <X size={16} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* NỘI DUNG CHÍNH (TỰ ĐỘNG THÍCH ỨNG THEO CHẾ ĐỘ PHÓNG TO HOẶC CHUẨN) */}
        <div className={`overflow-y-auto pr-1 ${isMaximized ? 'flex-1 py-4' : 'space-y-5'}`}>
          <div className={`${isMaximized ? 'grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full' : 'space-y-5'}`}>
            
            {/* CỘT 1: KHỐI MÃ QR VÀ NÚT TẢI VỀ */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-neutral-900 shadow-xl border border-white/20 transition-all ${
                isMaximized ? 'max-w-[320px] w-full' : 'max-w-[240px] mx-auto'
              }`}>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Mã QR mở lá thư"
                    className={`rounded-xl object-contain transition-all ${
                      isMaximized ? 'w-64 h-64' : 'w-44 h-44'
                    }`}
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-neutral-400 text-xs">
                    Đang tạo mã QR...
                  </div>
                )}
                <span className="text-[11px] font-serif font-bold text-neutral-700 mt-2">
                  Quét mã để mở thư bí mật 💌
                </span>
              </div>

              {/* Nút tải mã QR */}
              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-serif font-semibold text-amber-300 border border-white/10 hover:border-amber-400/40 shadow-md transition-all cursor-pointer"
              >
                <Download size={15} />
                <span>Tải ảnh mã QR (PNG)</span>
              </button>
            </div>

            {/* CỘT 2: LINK TRỰC TIẾP & MẪU TIN NHẮN */}
            <div className="space-y-4">
              {/* Khối Copy Link URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  Đường link mở thư trực tiếp:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={letterUrl}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800/90 border border-white/10 text-xs text-amber-200 select-all font-mono shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Khối Mẫu lời nhắn gửi kèm */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-300">
                    Mẫu tin nhắn gửi kèm người nhận:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-serif"
                  >
                    {copiedMessage ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedMessage ? 'Đã sao chép' : 'Sao chép tin nhắn'}</span>
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-800/70 border border-white/5 text-xs text-neutral-300 font-serif italic whitespace-pre-line leading-relaxed shadow-inner">
                  {messageTemplate}
                </div>
              </div>

              {/* Mẹo gửi quà khi phóng to */}
              {isMaximized && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/20 text-amber-200 text-xs font-serif leading-relaxed">
                  💡 <strong>Gợi ý:</strong> Bạn có thể in ảnh mã QR này ra để kẹp vào thiệp chúc mừng, hộp quà sinh nhật hoặc gửi mã QR qua tin nhắn để tạo bất ngờ cho người nhận.
                </div>
              )}
            </div>

          </div>
        </div>

        {/* THANH TẮT / NÚT TRỞ LẠI TÁC VỤ Ở ĐÁY CỬA SỔ */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          {isMaximized && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                setIsMaximized(false);
              }}
              className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-serif text-xs border border-white/10 transition-all cursor-pointer"
            >
              <span>Thu lại kích thước chuẩn</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundEngine.playClickSound();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-serif text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 hover:border-amber-400/40 shadow-md transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Đóng cửa sổ & Trở lại tác vụ</span>
          </button>
        </div>

      </div>
    </div>
  );
}
