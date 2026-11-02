import React, { useState, useEffect } from 'react';
import { Heart, Send, Sparkles, Check, MessageCircleHeart } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export default function LetterReplySection({ letterId, senderName = 'người gửi' }) {
  const [heartsCount, setHeartsCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem(`letter_hearts_${letterId}`) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [hasHearted, setHasHearted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sentReply, setSentReply] = useState(false);
  const [flyingHearts, setFlyingHearts] = useState([]);

  const handleHeartClick = () => {
    soundEngine.playClickSound();
    const newCount = heartsCount + 1;
    setHeartsCount(newCount);
    setHasHearted(true);
    try {
      localStorage.setItem(`letter_hearts_${letterId}`, newCount.toString());
    } catch {}

    // Hiệu ứng tim bay
    const newHeart = {
      id: Date.now() + Math.random(),
      left: 50 + (Math.random() * 30 - 15)
    };
    setFlyingHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setFlyingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    soundEngine.playClickSound();
    try {
      const existingReplies = JSON.parse(localStorage.getItem(`letter_replies_${letterId}`) || '[]');
      existingReplies.unshift({
        id: `reply_${Date.now()}`,
        text: replyText.trim(),
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(`letter_replies_${letterId}`, JSON.stringify(existingReplies));
    } catch {}

    setSentReply(true);
    setReplyText('');
  };

  return (
    <div className="mt-14 pt-8 border-t border-dashed border-amber-900/20 dark:border-white/10 select-none">
      <div className="max-w-md mx-auto text-center space-y-5">
        
        {/* NÚT THẢ TIM HỒI ĐÁP */}
        <div className="relative inline-block">
          <button
            type="button"
            onClick={handleHeartClick}
            className={`group inline-flex items-center gap-2.5 px-6 py-3 rounded-full transition-all duration-300 shadow-md cursor-pointer ${
              hasHearted
                ? 'bg-rose-500 text-white shadow-rose-500/30 scale-105'
                : 'bg-white/80 dark:bg-neutral-800 text-rose-500 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-neutral-700'
            }`}
          >
            <Heart size={20} className="fill-current animate-bounce" />
            <span className="font-serif font-bold text-sm">
              {hasHearted ? 'Đã gửi yêu thương' : 'Thả tim cho người gửi'}
            </span>
            {heartsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-black/10 dark:bg-white/20">
                {heartsCount}
              </span>
            )}
          </button>

          {/* Tim bay lơ lửng */}
          {flyingHearts.map((h) => (
            <span
              key={h.id}
              className="absolute pointer-events-none text-rose-500 text-2xl animate-fade-in-up"
              style={{
                left: `${h.left}%`,
                bottom: '100%',
                animation: 'flyUp 1.2s ease-out forwards'
              }}
            >
              💖
            </span>
          ))}
        </div>

        {/* Ô GỬI LỜI HỒI ÂM NHỎ */}
        {!sentReply ? (
          <form onSubmit={handleSendReply} className="space-y-2.5 pt-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-serif text-neutral-500 dark:text-neutral-400">
              <MessageCircleHeart size={14} className="text-amber-600 dark:text-amber-400" />
              <span>Gửi đôi dòng hồi âm đến {senderName}:</span>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="VD: Cảm ơn bạn rất nhiều vì lá thư ngọt ngào này..."
                className="w-full px-4 py-2.5 pr-12 rounded-2xl bg-white/70 dark:bg-neutral-800/80 border border-amber-900/20 dark:border-white/10 text-xs sm:text-sm font-serif italic text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-amber-400/40"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="absolute right-1.5 p-2 rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-30 transition-all cursor-pointer"
                title="Gửi hồi âm"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-serif italic animate-fade-in">
            <Check size={14} />
            <span>Lời hồi âm của bạn đã được lưu lại gửi đến người ấy! 💌</span>
          </div>
        )}

      </div>
    </div>
  );
}
