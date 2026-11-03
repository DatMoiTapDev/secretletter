import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RecipientView from './pages/RecipientView';

// Tách mã (Dynamic Code Splitting) và nạp lười (Lazy Loading) các trang không thiết yếu khi khởi động
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminEditor = lazy(() => import('./pages/AdminEditor'));
const MemberLogin = lazy(() => import('./pages/MemberLogin'));
const MemberDashboard = lazy(() => import('./pages/MemberDashboard'));
const MemberCompose = lazy(() => import('./pages/MemberCompose'));
const NotFoundLetterScreen = lazy(() =>
  import('./components/ErrorScreens').then((mod) => ({ default: mod.NotFoundLetterScreen }))
);

/**
 * Giao diện chờ tinh tế trong lúc tải các phân đoạn ứng dụng
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-pink-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 text-rose-900 dark:text-amber-200 transition-colors">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-rose-200/60 dark:border-white/10" />
        <div className="absolute inset-0 rounded-full border-4 border-rose-500 dark:border-amber-400 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm font-serif italic tracking-wide animate-pulse">
        Đang mở không gian lá thư... 💌
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {/* Portfolio / Personal Demo Badge */}
      <aside
        aria-label="Demo status"
        className="fixed bottom-3 right-3 z-50 pointer-events-none opacity-85 hover:opacity-100 transition-opacity"
      >
        <div className="bg-neutral-900/90 backdrop-blur-md text-amber-200 border border-amber-400/30 text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-auto flex items-center gap-2 font-sans">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium tracking-wide">Portfolio Demo • Lưu trữ cục bộ an toàn</span>
        </div>
      </aside>

      <Routes>
        {/* Trang chủ cổng thông tin (Công khai, nạp trực tiếp) */}
        <Route path="/" element={<Home />} />

        {/* Trải nghiệm người nhận mở và đọc lá thư (Công khai, nạp trực tiếp) */}
        <Route path="/letter/:id" element={<RecipientView />} />

        {/* Giao diện Thành viên: Đăng nhập & Không gian gửi nhận thư riêng (Lazy loaded) */}
        <Route path="/login" element={<MemberLogin />} />
        <Route path="/dashboard" element={<MemberDashboard />} />
        <Route path="/dashboard/compose" element={<MemberCompose />} />

        {/* Creator Studio quản lý lá thư & Quản trị tài khoản Master Admin (Lazy loaded) */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/new" element={<AdminEditor />} />
        <Route path="/admin/edit/:id" element={<AdminEditor />} />

        {/* Tuyến đường không hợp lệ */}
        <Route path="*" element={<NotFoundLetterScreen />} />
      </Routes>
    </Suspense>
  );
}
