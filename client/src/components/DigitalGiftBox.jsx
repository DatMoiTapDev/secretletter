import React, { useState } from 'react';
import { Gift, Sparkles, QrCode, Check, Copy, ExternalLink, Heart } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export default function DigitalGiftBox({ gift = null }) {
  const [isOpened, setIsOpened] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!gift || !gift.enabled) return null;

  const handleOpen = () => {
    soundEngine.playUnlockSound();
    setIsOpened(true);
  };

  const handleCopyCode = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    soundEngine.playClickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-12 select-none">
      <div className="relative max-w-lg mx-auto rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-amber-500/5 border-2 border-amber-500/30 shadow-xl overflow-hidden backdrop-blur-md">
        {/* Họa tiết trang trí lấp lánh */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-rose-400/20 blur-2xl pointer-events-none" />

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-serif font-bold uppercase tracking-wider mb-3">
            <Gift size={13} className="text-amber-600 dark:text-amber-400" />
            <span>Món Quà Bí Mật Đính Kèm</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-950 dark:text-amber-100 mb-2">
            {gift.title || 'Một bất ngờ nhỏ dành riêng cho bạn'}
          </h3>
          <p className="text-xs sm:text-sm font-serif italic text-neutral-600 dark:text-neutral-300 max-w-sm mx-auto mb-6">
            {gift.subtitle || 'Người gửi đã chu đáo chuẩn bị một món quà tinh thần kèm theo bức thư này.'}
          </p>

          {!isOpened ? (
            <div className="py-4">
              <button
                type="button"
                onClick={handleOpen}
                className="group relative inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-400 to-amber-500 text-neutral-950 font-serif font-bold text-sm tracking-wide shadow-lg hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              >
                <Gift size={18} className="transition-transform group-hover:rotate-12" />
                <span>Bóc Phong Bao Mở Quà</span>
                <Sparkles size={15} className="animate-spin text-neutral-900" style={{ animationDuration: '3s' }} />
              </button>
              <p className="text-[11px] font-serif text-neutral-400 mt-3 italic">
                Chạm vào phong bao để mở bất ngờ 💌
              </p>
            </div>
          ) : (
            <div className="animate-fade-in space-y-5 pt-2">
              {/* Lời chúc kèm món quà */}
              {gift.message && (
                <div className="p-4 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-amber-500/20 text-neutral-800 dark:text-neutral-200 text-sm font-serif italic leading-relaxed">
                  "{gift.message}"
                </div>
              )}

              {/* Nếu có mã QR Lì xì / Quà tặng (VietQR, Momo, Voucher QR) */}
              {gift.qrUrl && (
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-amber-500/30 shadow-md">
                  <div className="p-2 bg-white rounded-xl shadow-inner border border-neutral-200">
                    <img
                      src={gift.qrUrl}
                      alt="Mã QR Quà Tặng"
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                  </div>
                  <span className="text-xs font-serif font-bold text-amber-700 dark:text-amber-400 mt-2.5 flex items-center gap-1.5">
                    <QrCode size={14} />
                    <span>Quét mã nhận lì xì / quà tặng ngay</span>
                  </span>
                </div>
              )}

              {/* Nếu có mã Voucher / Mã kích hoạt */}
              {gift.voucherCode && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-amber-500/30">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-sans tracking-wider text-neutral-500 dark:text-neutral-400 block">
                      Mã quà tặng của bạn:
                    </span>
                    <span className="font-mono text-base font-bold text-amber-600 dark:text-amber-300">
                      {gift.voucherCode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(gift.voucherCode)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 pt-2 text-rose-500 text-xs font-serif italic">
                <Heart size={14} className="fill-current" />
                <span>Chúc bạn có một ngày thật ngọt ngào và hạnh phúc!</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
