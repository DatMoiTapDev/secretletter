import React from 'react';
import { Heart, Sparkles, Quote, Calendar } from 'lucide-react';
import PhotoGallery from './PhotoGallery';
import SecretUnsaid from './SecretUnsaid';
import FinalThought from './FinalThought';

export default function LetterReader({
  letter,
  theme,
  fontSize = 'base',
  isDarkPaper = false
}) {
  const content = letter.content || {};
  const greeting = content.greeting || `Gửi ${letter.recipientName || 'bạn'},`;
  const paragraphs = content.paragraphs || [];
  const quotes = content.quotes || [];
  const photos = letter.photos || [];

  // Font size class mapper
  const fontSizeClasses = {
    sm: 'text-sm sm:text-base leading-relaxed',
    base: 'text-base sm:text-lg leading-relaxed',
    lg: 'text-lg sm:text-xl leading-relaxed',
    xl: 'text-xl sm:text-2xl leading-relaxed'
  };

  const currentFontSize = fontSizeClasses[fontSize] || fontSizeClasses.base;

  // Paper styling class
  const paperBgClass = isDarkPaper
    ? 'paper-dark text-neutral-100 border-white/10'
    : 'paper-parchment text-neutral-900 border-amber-900/15';

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-10 sm:py-16 select-text">
      
      {/* KHỐI TRANG GIẤY LÁ THƯ (The Main Paper Sheet) */}
      <div 
        className={`relative rounded-3xl p-6 sm:p-12 md:p-16 border shadow-2xl transition-colors duration-500 ${paperBgClass}`}
      >
        {/* Họa tiết viền chỉ vàng tinh tế trên trang giấy */}
        <div className="absolute inset-3 sm:inset-4 rounded-2xl border border-amber-500/20 pointer-events-none" />

        {/* TIÊU ĐỀ LÁ THƯ VÀ THỜI GIAN */}
        <div className="text-center border-b border-amber-900/15 dark:border-white/10 pb-8 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs tracking-wider uppercase mb-3">
            <Sparkles size={12} />
            <span>Thư gửi riêng tư</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-amber-950 dark:text-amber-100 tracking-tight mb-3">
            {letter.title || 'Lá Thư Gửi Riêng Bạn'}
          </h2>

          {letter.createdAt && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-serif italic">
              <Calendar size={12} />
              <span>
                {new Date(letter.createdAt).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        {/* LỜI MỞ ĐẦU THÂN MẬT (Greeting) */}
        <div className="mb-8">
          <h3 className="font-handwriting text-3xl sm:text-4xl text-amber-900 dark:text-amber-300 font-bold">
            {greeting}
          </h3>
        </div>

        {/* NỘI DUNG CHÍNH (Paragraphs) */}
        <div className={`space-y-6 font-serif ${currentFontSize}`}>
          {paragraphs.map((para, idx) => (
            <p 
              key={idx} 
              className="first-letter:text-2xl first-letter:font-bold first-letter:text-amber-700 dark:first-letter:text-amber-400 text-justify hyphens-auto"
            >
              {para}
            </p>
          ))}
        </div>

        {/* CÁC PHẦN TÂM TƯ / QUOTES ĐẶC BIỆT */}
        {quotes.length > 0 && (
          <div className="my-10 space-y-6">
            {quotes.map((quote, idx) => (
              <div 
                key={idx}
                className="relative p-6 rounded-2xl bg-amber-500/10 dark:bg-neutral-800/60 border-l-4 border-amber-500 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-300 font-serif font-bold text-sm">
                  <span>{quote.tag || '💭 Điều mình muốn nói'}</span>
                </div>
                <p className={`font-serif italic leading-relaxed text-neutral-800 dark:text-neutral-200 ${currentFontSize}`}>
                  "{quote.text}"
                </p>
                <Quote size={24} className="absolute right-4 bottom-4 text-amber-500/20 pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {/* BỘ SƯU TẬP ẢNH KỶ NIỆM (Photo Gallery) */}
        {photos.length > 0 && (
          <PhotoGallery photos={photos} />
        )}

        {/* ĐIỀU CHƯA NÓI (Interactive Secret Section) */}
        {letter.secretUnsaid && letter.secretUnsaid.enabled && (
          <SecretUnsaid config={letter.secretUnsaid} />
        )}

        {/* LỜI KẾT & CHỮ KÝ */}
        <div className="mt-12 pt-8 border-t border-amber-900/15 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400">
            <Heart size={18} className="fill-current" />
            <span className="font-serif text-xs text-neutral-500 dark:text-neutral-400 italic">
              Trao gửi bằng tất cả sự chân thành
            </span>
          </div>

          <div className="text-right">
            <p className="font-handwriting text-3xl sm:text-4xl text-amber-900 dark:text-amber-200 font-bold">
              Người gửi tặng bạn
            </p>
          </div>
        </div>

        {/* ĐIỀU CUỐI CÙNG (Final Spotlight Card) */}
        {letter.finalThought && letter.finalThought.enabled && (
          <FinalThought config={letter.finalThought} />
        )}

      </div>

    </div>
  );
}
