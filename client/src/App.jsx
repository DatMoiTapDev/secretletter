import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RecipientView from './pages/RecipientView';
import AdminDashboard from './pages/AdminDashboard';
import AdminEditor from './pages/AdminEditor';
import DualView from './pages/DualView';
import MemberLogin from './pages/MemberLogin';
import MemberDashboard from './pages/MemberDashboard';
import MemberCompose from './pages/MemberCompose';
import { NotFoundLetterScreen } from './components/ErrorScreens';

export default function App() {
  return (
    <Routes>
      {/* Trang chủ cổng thông tin (Công khai, không cần đăng nhập) */}
      <Route path="/" element={<Home />} />

      {/* Chế độ xem song song 2 màn hình: Điện thoại & Máy tính */}
      <Route path="/dual" element={<DualView />} />

      {/* Trải nghiệm người nhận mở và đọc lá thư */}
      <Route path="/letter/:id" element={<RecipientView />} />

      {/* Giao diện Thành viên: Đăng nhập & Không gian gửi nhận thư riêng */}
      <Route path="/login" element={<MemberLogin />} />
      <Route path="/dashboard" element={<MemberDashboard />} />
      <Route path="/dashboard/compose" element={<MemberCompose />} />

      {/* Creator Studio quản lý lá thư & Quản trị tài khoản Master Admin */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/new" element={<AdminEditor />} />
      <Route path="/admin/edit/:id" element={<AdminEditor />} />

      {/* Tuyến đường không hợp lệ */}
      <Route path="*" element={<NotFoundLetterScreen />} />
    </Routes>
  );
}
