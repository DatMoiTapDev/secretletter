import React from 'react';
import { MailQuestion, ClockAlert, ArrowLeft, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundLetterScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900/90 border border-white/15 text-center shadow-2xl backdrop-blur-md">
        <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-amber-400">
          <MailQuestion size={36} />
        </div>

        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
          Không tìm thấy lá thư 💌
        </h2>

        <p className="text-neutral-300 font-serif italic mb-8 leading-relaxed">
          "Có vẻ chiếc phong bì này đã đi lạc mất rồi... Hãy kiểm tra lại đường dẫn mà người ấy đã gửi cho bạn nhé."
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-sm transition-all"
          >
            <Home size={16} />
            <span>Về Trang Chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ExpiredLetterScreen({ expiresAt }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900/90 border border-rose-500/30 text-center shadow-2xl backdrop-blur-md">
        <div className="w-20 h-20 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-6 text-rose-400">
          <ClockAlert size={36} />
        </div>

        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
          Lá thư đã hết thời hạn ⏳
        </h2>

        <p className="text-neutral-300 font-serif italic mb-6 leading-relaxed">
          "Kỷ niệm đẹp đôi khi chỉ dành cho một khoảnh khắc nhất định. Lá thư này đã khép lại theo ý nguyện của người gửi."
        </p>

        {expiresAt && (
          <p className="text-xs text-neutral-500 mb-8 font-mono">
            Hạn mở: {new Date(expiresAt).toLocaleString('vi-VN')}
          </p>
        )}

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-serif text-sm transition-all"
        >
          <ArrowLeft size={16} />
          <span>Quay lại</span>
        </Link>
      </div>
    </div>
  );
}

export function NetworkErrorScreen({ onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white select-none">
      <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900/90 border border-amber-500/20 text-center shadow-2xl backdrop-blur-md">
        <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-amber-400">
          <RefreshCw size={32} className="animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
          Đường truyền đang tạm lắng 🕊️
        </h2>

        <p className="text-neutral-300 font-serif italic mb-8 leading-relaxed">
          "Hình như cơn gió mang lá thư đến đang bị ngắt quãng đôi chút. Bạn thử kết nối lại để tiếp tục hành trình cảm xúc nhé."
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-neutral-950 font-serif font-bold text-sm hover:bg-amber-400 cursor-pointer shadow-md transition-all"
            >
              <RefreshCw size={15} />
              <span>Kết nối lại</span>
            </button>
          )}

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-serif text-sm transition-all"
          >
            <ArrowLeft size={15} />
            <span>Trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
