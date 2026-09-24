import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  Smartphone,
  Monitor,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  Sun,
  Moon
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export default function DualView() {
  const [currentPath, setCurrentPath] = useState('/');
  const [key, setKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const phoneIframeRef = useRef(null);
  const desktopIframeRef = useRef(null);

  const handleRefresh = () => {
    soundEngine.playClickSound();
    setKey(prev => prev + 1);
  };

  const handleSelectPath = (path) => {
    soundEngine.playClickSound();
    setCurrentPath(path);
  };

  const quickPages = [
    { name: 'Trang Chủ (Bong bóng)', path: '/' },
    { name: 'Admin Hub', path: '/admin' },
    { name: 'Soạn Thư Mới', path: '/admin/new' }
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${
      isDarkMode ? 'bg-[#0b0f19] text-white' : 'bg-neutral-100 text-neutral-900'
    }`}>
      {/* THANH ĐIỀU KHIỂN CHẾ ĐỘ 2 MÀN HÌNH */}
      <header className={`sticky top-0 z-50 px-4 py-3 border-b backdrop-blur-md flex flex-wrap items-center justify-between gap-3 ${
        isDarkMode
          ? 'bg-neutral-900/90 border-white/10 text-white'
          : 'bg-white/90 border-neutral-200 text-neutral-900 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            onClick={() => soundEngine.playClickSound()}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-serif transition-colors ${
              isDarkMode
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                : 'bg-neutral-200/70 hover:bg-neutral-200 text-neutral-800'
            }`}
          >
            <ArrowLeft size={14} />
            <span>Thoát 2 Màn hình</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <span className="font-serif font-bold text-sm">Chế Độ So Sánh Song Song:</span>
            <div className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/20">
              <Smartphone size={13} />
              <span>Mobile (390px)</span>
              <span className="mx-1">•</span>
              <Monitor size={13} />
              <span>Laptop (Desktop)</span>
            </div>
          </div>
        </div>

        {/* CÁC TRANG CẦN KIỂM THỬ */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {quickPages.map((pg) => {
            const isCur = currentPath === pg.path;
            return (
              <button
                key={pg.path}
                type="button"
                onClick={() => handleSelectPath(pg.path)}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans transition-all cursor-pointer whitespace-nowrap ${
                  isCur
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                    : isDarkMode
                      ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {pg.name}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleRefresh}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
            title="Làm mới cả 2 màn hình"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      {/* KHU VỰC 2 KHUNG MÀN HÌNH SONG SONG */}
      <main className="flex-1 p-3 sm:p-6 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-6 xl:gap-8 overflow-x-auto">
        
        {/* ========================================================
            MÀN HÌNH 1: ĐIỆN THOẠI (MOBILE IPHONE 15 MOCKUP)
            ======================================================== */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="flex items-center gap-2 mb-2 text-xs font-serif font-bold text-neutral-600 dark:text-neutral-400">
            <Smartphone size={15} className="text-amber-500" />
            <span>Giao Diện Điện Thoại (390 × 800 px)</span>
          </div>

          {/* Vỏ khung điện thoại */}
          <div className="relative w-[390px] h-[800px] rounded-[50px] border-[10px] border-neutral-900 shadow-2xl bg-black overflow-hidden ring-1 ring-white/10">
            {/* Dynamic Island / Loa thoại trên cùng */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 pointer-events-none flex items-center justify-end px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#111] ring-1 ring-neutral-800" />
            </div>

            {/* Màn hình hiển thị Web thực tế */}
            <iframe
              ref={phoneIframeRef}
              key={`phone-${key}-${currentPath}`}
              src={currentPath}
              title="Mobile Preview"
              className="w-full h-full border-0 bg-white"
            />
          </div>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 font-mono">
            Tối ưu fit 2 cột bong bóng, mở khóa & cuộn thư mượt mà
          </span>
        </div>

        {/* ========================================================
            MÀN HÌNH 2: MÁY TÍNH / LAPTOP (DESKTOP BROWSER MOCKUP)
            ======================================================== */}
        <div className="flex flex-col items-center flex-1 w-full max-w-5xl min-w-[320px]">
          <div className="flex items-center gap-2 mb-2 text-xs font-serif font-bold text-neutral-600 dark:text-neutral-400">
            <Monitor size={15} className="text-sky-500" />
            <span>Giao Diện Laptop / Máy Tính (Desktop Responsive)</span>
          </div>

          {/* Vỏ khung trình duyệt Laptop */}
          <div className="w-full h-[800px] rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Thanh tiêu đề trình duyệt máy tính */}
            <div className="h-10 px-4 flex items-center gap-3 bg-neutral-200 dark:bg-neutral-950 border-b border-neutral-300 dark:border-neutral-800">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>

              {/* Thanh địa chỉ URL máy tính */}
              <div className="flex-1 max-w-md mx-auto h-6 px-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 flex items-center text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
                <span>https://secretletter.app{currentPath}</span>
              </div>
            </div>

            {/* Màn hình hiển thị Web Desktop */}
            <iframe
              ref={desktopIframeRef}
              key={`desktop-${key}-${currentPath}`}
              src={currentPath}
              title="Desktop Preview"
              className="w-full flex-1 border-0 bg-white"
            />
          </div>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 font-mono">
            Tối ưu 4 cột bong bóng, hiệu ứng phong bì 3D bay bổng
          </span>
        </div>

      </main>
    </div>
  );
}
