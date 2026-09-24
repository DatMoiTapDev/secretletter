import React, { useState } from 'react';
import { ZoomIn, X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export default function PhotoGallery({ photos = [] }) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  if (!photos || photos.length === 0) return null;

  const openLightbox = (index) => {
    soundEngine.playClickSound();
    setActivePhotoIndex(index);
  };

  const closeLightbox = () => {
    soundEngine.playClickSound();
    setActivePhotoIndex(null);
  };

  const nextPhoto = (e) => {
    e.stopPropagation();
    soundEngine.playClickSound();
    setActivePhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    soundEngine.playClickSound();
    setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="my-10">
      <div className="flex items-center gap-2 mb-6 text-amber-900/80 dark:text-amber-200/80">
        <Camera size={18} />
        <span className="font-serif italic text-sm tracking-wide">Những khoảnh khắc đáng nhớ...</span>
      </div>

      {/* Grid danh sách ảnh theo phong cách Polaroid / Lưới nghệ thuật */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-6 items-center justify-center">
        {photos.map((photo, idx) => {
          // Xoay nhẹ từng bức ảnh polaroid để tạo cảm giác tự nhiên như ảnh thật
          const rotations = ['-rotate-1', 'rotate-2', '-rotate-2', 'rotate-1', '-rotate-0.5'];
          const rotationClass = rotations[idx % rotations.length];

          return (
            <div
              key={idx}
              onClick={() => openLightbox(idx)}
              className={`group relative polaroid-card ${rotationClass} cursor-pointer rounded-sm`}
            >
              {/* Băng dính Washi Tape trang trí */}
              <div className="washi-tape" />

              {/* Khung ảnh */}
              <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-neutral-100 rounded-xs">
                <img
                  src={photo.url}
                  alt={photo.caption || 'Kỷ niệm'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Overlay nút phóng to */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2.5 rounded-full bg-white/90 text-neutral-900 shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <ZoomIn size={18} />
                  </div>
                </div>
              </div>

              {/* Chú thích viết tay bên dưới ảnh */}
              {photo.caption && (
                <div className="mt-3 text-center">
                  <p className="font-handwriting text-xl sm:text-2xl text-neutral-800 leading-tight">
                    {photo.caption}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL PHÓNG TO ẢNH (Lightbox Modal) */}
      {activePhotoIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none animate-fade-in"
          onClick={closeLightbox}
        >
          {/* Nút đóng */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-5 right-5 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-60"
          >
            <X size={24} />
          </button>

          {/* Nút lùi ảnh */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={prevPhoto}
              className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer z-60"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Ảnh phóng to */}
          <div
            className="relative max-w-4xl max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[activePhotoIndex].url}
              alt={photos[activePhotoIndex].caption}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />
            {photos[activePhotoIndex].caption && (
              <p className="mt-4 font-handwriting text-2xl md:text-3xl text-amber-200 text-center drop-shadow-md">
                {photos[activePhotoIndex].caption}
              </p>
            )}
          </div>

          {/* Nút tiến ảnh */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={nextPhoto}
              className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer z-60"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
