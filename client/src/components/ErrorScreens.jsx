import React from 'react';
import {
  MailQuestion,
  ClockAlert,
  ArrowLeft,
  RefreshCw,
  Home,
  Inbox,
  Send,
  Users,
  PenLine,
  UserPlus,
  WifiOff,
  CloudUpload
} from 'lucide-react';
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

        <p className="text-neutral-300 font-serif italic mb-8 leading-relaxed text-sm sm:text-base">
          "Có vẻ chiếc phong bì này đã đi lạc mất rồi... Hãy kiểm tra lại đường dẫn mà người ấy đã gửi cho bạn nhé."
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-sm transition-all shadow-md cursor-pointer"
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

        <p className="text-neutral-300 font-serif italic mb-6 leading-relaxed text-sm sm:text-base">
          "Kỷ niệm đẹp đôi khi chỉ dành cho một khoảnh khắc nhất định. Lá thư này đã khép lại theo ý nguyện của người gửi."
        </p>

        {expiresAt && (
          <p className="text-xs text-neutral-400 mb-8 font-mono bg-white/5 py-1.5 px-3 rounded-lg inline-block">
            Hạn mở: {new Date(expiresAt).toLocaleString('vi-VN')}
          </p>
        )}

        <div>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-serif text-sm transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </Link>
        </div>
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

        <p className="text-neutral-300 font-serif italic mb-8 leading-relaxed text-sm sm:text-base">
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-serif text-sm transition-all cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state cho Hòm thư nhận và Thư đã gửi
 */
export function EmptyLettersScreen({ type = 'inbox', onComposeClick }) {
  const isInbox = type === 'inbox';
  return (
    <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 shadow-inner">
        {isInbox ? <Inbox size={28} /> : <Send size={28} />}
      </div>
      <h3 className="font-serif font-bold text-lg sm:text-xl text-neutral-800 dark:text-neutral-200 mb-2">
        {isInbox ? 'Hòm thư đang yên tĩnh 🕊️' : 'Chưa có phong bì nào được gửi đi'}
      </h3>
      <p className="text-sm font-serif italic text-neutral-500 dark:text-neutral-400 max-w-sm mb-6 leading-relaxed">
        {isInbox
          ? 'Chưa có ai gửi thư đích danh cho bạn lúc này. Bạn có thể chủ động viết một lá thư chân thành gửi đến người thương trước nhé!'
          : 'Hãy viết những dòng tâm tình đầu tiên và gửi gắm điều chưa từng nói đến người bạn trân quý.'}
      </p>
      {onComposeClick && (
        <button
          type="button"
          onClick={onComposeClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs sm:text-sm shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <PenLine size={15} />
          <span>Soạn lá thư mới ngay</span>
        </button>
      )}
    </div>
  );
}

/**
 * Empty state khi chưa có thành viên nào trong Creator Studio
 */
export function EmptyUsersScreen({ onAddUserClick }) {
  return (
    <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 shadow-inner">
        <Users size={28} />
      </div>
      <h3 className="font-serif font-bold text-lg sm:text-xl text-neutral-800 dark:text-neutral-200 mb-2">
        Chưa có thành viên nào trong danh sách
      </h3>
      <p className="text-sm font-serif italic text-neutral-500 dark:text-neutral-400 max-w-sm mb-6 leading-relaxed">
        Cấp tài khoản cho bạn bè hoặc người thân để họ có thể đăng nhập, nhận thư riêng và gửi gắm những lời nhắn bảo mật.
      </p>
      {onAddUserClick && (
        <button
          type="button"
          onClick={onAddUserClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs sm:text-sm shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <UserPlus size={15} />
          <span>Thêm thành viên đầu tiên</span>
        </button>
      )}
    </div>
  );
}

/**
 * Thanh thông báo trạng thái ngoại tuyến / đồng bộ đang chờ
 */
export function OfflineNoticeBanner({ isOffline = false, pendingSync = false }) {
  if (!isOffline && !pendingSync) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-amber-500/95 text-neutral-950 px-4 py-2 text-xs font-serif font-medium shadow-md flex items-center justify-center gap-2 backdrop-blur-md">
      {isOffline ? (
        <>
          <WifiOff size={14} className="shrink-0" />
          <span>Đang ở chế độ ngoại tuyến — Thay đổi của bạn được lưu an toàn trên máy và sẽ tự động đồng bộ khi có mạng.</span>
        </>
      ) : (
        <>
          <CloudUpload size={14} className="shrink-0 animate-bounce" />
          <span>Có thay đổi chưa gửi lên đám mây — Đang chờ đồng bộ...</span>
        </>
      )}
    </div>
  );
}
