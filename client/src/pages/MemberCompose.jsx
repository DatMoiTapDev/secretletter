import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Send,
  ArrowLeft,
  Sparkles,
  Lock,
  Music,
  Heart,
  Calendar,
  Gift,
  Feather,
  Copy,
  Check,
  Eye,
  Sun,
  Moon,
  Camera,
  Trash2,
  Plus,
  QrCode,
  Lightbulb,
  Infinity as InfinityIcon,
  HelpCircle,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import { THEMES, THEME_LIST, getTheme } from '../types/theme';
import { soundEngine } from '../audio/soundEngine';
import ShareModal from '../components/ShareModal';
import RecipientView from './RecipientView';

// Ngân hàng gợi ý ý tưởng tâm tình theo chủ đề (Emotional Prompts Bank)
const EMOTIONAL_PROMPTS = {
  cute: [
    {
      title: 'Khoảnh khắc đầu tiên',
      text: 'Có những ngày bình thường bỗng chốc trở nên đặc biệt, chỉ vì trong ký ức của mình có thêm nụ cười của bạn...'
    },
    {
      title: 'Điều chưa từng nói',
      text: 'Thật ra mình đã muốn nói với bạn điều này từ rất lâu, nhưng mỗi lần đứng trước bạn, tim mình lại đập nhanh hơn bình thường...'
    },
    {
      title: 'Lời hứa dịu dàng',
      text: 'Dẫu thế giới ngoài kia có vội vã đến đâu, mong rằng mỗi khi bạn mỏi mệt, bạn sẽ nhớ rằng luôn có một người sẵn sàng lắng nghe bạn.'
    }
  ],
  birthday: [
    {
      title: 'Chúc tuổi mới rực rỡ',
      text: 'Chúc bạn tuổi mới ngập tràn tiếng cười, thêm nhiều ước mơ thành hiện thực và luôn được yêu thương bởi những người xung quanh!'
    },
    {
      title: 'Kỷ niệm thêm một tuổi',
      text: 'Thêm một tuổi không có nghĩa là già đi, mà là thêm một năm để bạn gom góp những điều kỳ diệu và hạnh phúc cho chính mình.'
    }
  ],
  tet: [
    {
      title: 'Bình an năm mới',
      text: 'Khép lại năm cũ với bao bộn bề, gửi đến bạn lời chúc an yên nhất. Mong năm mới gia đình sum vầy, vạn sự hanh thông.'
    },
    {
      title: 'Xuân ấm áp',
      text: 'Năm mới đến rồi, chúc cho nụ cười trên môi bạn luôn rạng rỡ như hoa mai nở sớm đầu xuân!'
    }
  ],
  emotional: [
    {
      title: 'Lời cảm ơn chân thành',
      text: 'Cảm ơn vì đã xuất hiện và đồng hành cùng mình qua những ngày giông bão. Sự hiện diện của bạn là món quà vô giá.'
    },
    {
      title: 'Nhắn nhủ những ngày khó khăn',
      text: 'Nếu hôm nay có quá mệt mỏi, hãy cho phép mình được nghỉ ngơi một chút nhé. Bạn đã làm rất tốt rồi, mình luôn tin ở bạn.'
    }
  ]
};

export default function MemberCompose() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('member_user') || 'null');
    } catch {
      return null;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // 1: Phong cách & Người nhận, 2: Tâm tình & Kỷ niệm, 3: Bất ngờ & Bảo mật
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('cute');
  const [waxMonogram, setWaxMonogram] = useState('');
  const [title, setTitle] = useState('');
  const [greeting, setGreeting] = useState('');
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState([]); // [{ url, caption }]
  const [secretUnsaid, setSecretUnsaid] = useState('');
  const [finalThought, setFinalThought] = useState('');
  
  // Quà tặng bất ngờ (Digital Gift)
  const [giftEnabled, setGiftEnabled] = useState(false);
  const [giftTitle, setGiftTitle] = useState('Món Quà Bí Mật Dành Tặng Bạn');
  const [giftMessage, setGiftMessage] = useState('');
  const [giftQrUrl, setGiftQrUrl] = useState('');
  const [giftVoucherCode, setGiftVoucherCode] = useState('');

  // Bảo mật & Thời hạn
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Hệ thống người dùng gợi ý
  const [systemUsers, setSystemUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdLetter, setCreatedLetter] = useState(null);

  useEffect(() => {
    if (!user || !user.id) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // Tải danh sách người dùng để gợi ý
  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setSystemUsers(data.data.filter(u => u.username !== user?.username));
        }
      })
      .catch(() => {});
  }, [user]);

  // Khôi phục bản nháp nếu có
  useEffect(() => {
    try {
      const saved = localStorage.getItem('member_compose_draft_v2');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.recipientName) setRecipientName(d.recipientName);
        if (d.recipientUsername) setRecipientUsername(d.recipientUsername);
        if (d.selectedTheme) setSelectedTheme(d.selectedTheme);
        if (d.waxMonogram) setWaxMonogram(d.waxMonogram);
        if (d.title) setTitle(d.title);
        if (d.greeting) setGreeting(d.greeting);
        if (d.message) setMessage(d.message);
        if (d.photos) setPhotos(d.photos);
        if (d.secretUnsaid) setSecretUnsaid(d.secretUnsaid);
        if (d.finalThought) setFinalThought(d.finalThought);
        if (d.giftEnabled !== undefined) setGiftEnabled(d.giftEnabled);
        if (d.giftTitle) setGiftTitle(d.giftTitle);
        if (d.giftMessage) setGiftMessage(d.giftMessage);
        if (d.giftQrUrl) setGiftQrUrl(d.giftQrUrl);
        if (d.giftVoucherCode) setGiftVoucherCode(d.giftVoucherCode);
        if (d.hasPassword) setHasPassword(d.hasPassword);
        if (d.password) setPassword(d.password);
        if (d.passwordHint) setPasswordHint(d.passwordHint);
        if (d.expiresAt) setExpiresAt(d.expiresAt);
      }
    } catch {}
  }, []);

  // Tự động lưu bản nháp mỗi 1.2s
  useEffect(() => {
    if (!recipientName && !message && !title) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('member_compose_draft_v2', JSON.stringify({
          recipientName,
          recipientUsername,
          selectedTheme,
          waxMonogram,
          title,
          greeting,
          message,
          photos,
          secretUnsaid,
          finalThought,
          giftEnabled,
          giftTitle,
          giftMessage,
          giftQrUrl,
          giftVoucherCode,
          hasPassword,
          password,
          passwordHint,
          expiresAt
        }));
      } catch {}
    }, 1200);
    return () => clearTimeout(timer);
  }, [recipientName, recipientUsername, selectedTheme, waxMonogram, title, greeting, message, photos, secretUnsaid, finalThought, giftEnabled, giftTitle, giftMessage, giftQrUrl, giftVoucherCode, hasPassword, password, passwordHint, expiresAt]);

  const handleClearDraft = () => {
    soundEngine.playClickSound();
    try {
      localStorage.removeItem('member_compose_draft_v2');
    } catch {}
    setRecipientName('');
    setRecipientUsername('');
    setTitle('');
    setGreeting('');
    setMessage('');
    setPhotos([]);
    setSecretUnsaid('');
    setFinalThought('');
    setGiftEnabled(false);
    setGiftQrUrl('');
    setGiftVoucherCode('');
    setHasPassword(false);
    setPassword('');
    setPasswordHint('');
    setExpiresAt('');
  };

  const handleToggleDarkMode = () => {
    soundEngine.playClickSound();
    setIsDarkMode(prev => !prev);
  };

  const handleThemeChange = (themeId) => {
    soundEngine.playThemeTrack(themeId);
    setSelectedTheme(themeId);
  };

  // Nén ảnh thông minh bằng Canvas (< 40KB)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playClickSound();
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPhotos(prev => [...prev, { url: compressedDataUrl, caption: '' }]);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Nén mã QR quà tặng
  const handleQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playClickSound();
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        setGiftQrUrl(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPrompt = (promptText) => {
    soundEngine.playClickSound();
    if (!message) {
      setMessage(promptText);
    } else {
      setMessage(prev => `${prev}\n\n${promptText}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!recipientName.trim()) {
      setError('Vui lòng điền tên người nhận ở Bước 1.');
      setActiveStep(1);
      return;
    }

    if (!message.trim()) {
      setError('Vui lòng nhập đôi dòng tâm tư ở Bước 2.');
      setActiveStep(2);
      return;
    }

    soundEngine.playClickSound();
    setLoading(true);

    const paragraphs = message
      .split('\n\n')
      .map(p => p.trim())
      .filter(Boolean);

    const payload = {
      recipientName: recipientName.trim(),
      recipientUsername: recipientUsername.trim().toLowerCase(),
      theme: selectedTheme,
      waxMonogram: waxMonogram.trim().toUpperCase() || '',
      title: title.trim() || 'Lá Thư Dành Riêng Cho Bạn',
      introQuote: `Có một vài điều mình muốn ${recipientName.trim()} đọc thật chậm...`,
      content: {
        greeting: greeting.trim() || `Gửi ${recipientName.trim()},`,
        paragraphs: paragraphs.length > 0 ? paragraphs : [message.trim()],
        quotes: []
      },
      photos: photos.filter(p => p.url),
      secretUnsaid: secretUnsaid.trim() ? {
        enabled: true,
        prompt: 'Vẫn còn một điều nhỏ mình chưa nói...',
        buttonText: 'Mở điều này',
        content: secretUnsaid.trim()
      } : { enabled: false },
      finalThought: finalThought.trim() ? {
        enabled: true,
        prompt: 'Lời nhắn gửi cuối cùng...',
        content: finalThought.trim()
      } : { enabled: false },
      gift: giftEnabled ? {
        enabled: true,
        title: giftTitle.trim() || 'Món Quà Bí Mật',
        message: giftMessage.trim(),
        qrUrl: giftQrUrl,
        voucherCode: giftVoucherCode.trim()
      } : { enabled: false },
      hasPassword,
      password: hasPassword ? password.trim() : '',
      passwordHint: hasPassword ? passwordHint.trim() : '',
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
    };

    try {
      const res = await fetch('/api/user/letters/compose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-name': user.username
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        try {
          localStorage.removeItem('member_compose_draft_v2');
        } catch {}
        setCreatedLetter(data.data || data.letter || payload);
      } else {
        setError(data.message || 'Lỗi khi gửi thư.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Dữ liệu dùng để Live Preview
  const previewData = {
    id: 'preview_draft',
    recipientName: recipientName.trim() || 'Người bạn thương',
    title: title.trim() || 'Lá Thư Dành Riêng Cho Bạn',
    introQuote: `Có một vài điều mình muốn ${recipientName.trim() || 'bạn'} đọc thật chậm...`,
    theme: selectedTheme,
    waxMonogram: waxMonogram.trim().toUpperCase(),
    hasPassword,
    content: {
      greeting: greeting.trim() || `Gửi ${recipientName.trim() || 'bạn'},`,
      paragraphs: message.split('\n\n').filter(Boolean).length > 0 ? message.split('\n\n').filter(Boolean) : ['Đôi dòng tâm tư nắn nót trao gửi đến bạn...'],
      quotes: []
    },
    photos,
    secretUnsaid: secretUnsaid.trim() ? { enabled: true, content: secretUnsaid.trim() } : { enabled: false },
    finalThought: finalThought.trim() ? { enabled: true, content: finalThought.trim() } : { enabled: false },
    gift: giftEnabled ? { enabled: true, title: giftTitle, message: giftMessage, qrUrl: giftQrUrl, voucherCode: giftVoucherCode } : { enabled: false },
    senderName: user.displayName || user.username
  };

  const cardCls = isDarkMode
    ? 'bg-neutral-900/90 border-white/10 text-neutral-100 shadow-xl'
    : 'bg-white border-neutral-200/90 text-neutral-900 shadow-xs';
  const inputCls = isDarkMode
    ? 'bg-neutral-800 border-white/10 text-white placeholder-neutral-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30'
    : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30';
  const labelCls = isDarkMode
    ? 'text-neutral-300 font-medium text-xs'
    : 'text-stone-700 font-medium text-xs';

  return (
    <div className={`min-h-screen transition-colors duration-500 p-4 sm:p-8 ${
      isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#faf8f5] text-neutral-900'
    }`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER ĐIỀU HƯỚNG */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            onClick={() => soundEngine.playClickSound()}
            className={`inline-flex items-center gap-1.5 text-xs font-serif transition-colors ${
              isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ArrowLeft size={14} />
            <span>Về hòm thư cá nhân</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* NÚT XEM TRƯỚC THỜI GIAN THỰC */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                setShowLivePreview(prev => !prev);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition-all shadow-xs cursor-pointer ${
                showLivePreview
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : isDarkMode
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-white/10'
                    : 'bg-white hover:bg-neutral-100 text-amber-800 border border-neutral-300 shadow-xs'
              }`}
            >
              <Eye size={14} />
              <span>{showLivePreview ? 'Tắt xem trước' : 'Xem trước lá thư'}</span>
            </button>

            {/* NỀN SÁNG / TỐI */}
            <button
              type="button"
              onClick={handleToggleDarkMode}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDarkMode ? 'bg-neutral-800 border-white/10 text-amber-300' : 'bg-white border-neutral-300 text-amber-600'
              }`}
            >
              {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>
        </div>

        {/* TIÊU ĐỀ CHÍNH */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amber-700 dark:text-amber-400">
            Soạn Bức Thư Tâm Tình
          </h1>
          <p className={`text-xs max-w-md mx-auto ${isDarkMode ? 'text-neutral-400' : 'text-stone-500'}`}>
            Trao gửi những điều chân thành nhất đến người bạn trân quý 💌
          </p>
        </div>

        {/* NẾU ĐANG BẬT LIVE PREVIEW */}
        {showLivePreview ? (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-xs font-serif text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>👀 Chế độ xem trước lá thư thời gian thực</span>
              <button
                type="button"
                onClick={() => setShowLivePreview(false)}
                className="px-3 py-1 rounded-xl bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 cursor-pointer"
              >
                Tiếp tục chỉnh sửa ✍️
              </button>
            </div>
            <div className="rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl">
              <RecipientView previewData={previewData} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* THANH ĐIỀU HƯỚNG 3 BƯỚC THƠ MỘNG */}
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-neutral-200/60 dark:bg-neutral-900 border border-neutral-300/50 dark:border-white/10">
              {[
                { step: 1, label: '1. Người Nhận & Con Dấu' },
                { step: 2, label: '2. Tâm Tình & Ảnh' },
                { step: 3, label: '3. Quà Tặng & Mật Khẩu' }
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    soundEngine.playClickSound();
                    setActiveStep(s.step);
                  }}
                  className={`py-2 px-2 sm:px-4 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer truncate ${
                    activeStep === s.step
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* BƯỚC 1: NGƯỜI NHẬN, CHỦ ĐỀ & CON DẤU HOÀNG GIA */}
            {activeStep === 1 && (
              <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 animate-fade-in ${cardCls}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>
                      Tên người nhận (In trang trọng ngoài phong bì) <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="VD: Hà Phương, Vân Anh, Mẹ yêu..."
                      className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm outline-none ${inputCls}`}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      Tài khoản người nhận (@username - Gửi thẳng vào hòm thư):
                    </label>
                    <input
                      type="text"
                      value={recipientUsername}
                      onChange={(e) => setRecipientUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                      placeholder="VD: va123, tien123... (để trống nếu gửi qua link riêng)"
                      className={`w-full mt-1.5 px-4 py-2.5 rounded-xl font-mono text-sm outline-none ${inputCls}`}
                    />
                    {/* Gợi ý bạn bè trong hệ thống */}
                    {systemUsers.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] text-neutral-400">Gợi ý nhanh:</span>
                        {systemUsers.slice(0, 4).map(u => (
                          <button
                            key={u.username}
                            type="button"
                            onClick={() => {
                              soundEngine.playClickSound();
                              setRecipientUsername(u.username);
                              if (!recipientName) setRecipientName(u.displayName || u.username);
                            }}
                            className="px-2 py-0.5 rounded-lg text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/20 hover:bg-amber-500/20 cursor-pointer"
                          >
                            @{u.username}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* CHỦ ĐỀ PHONG BÌ & NHẠC */}
                <div>
                  <label className={labelCls}>Chọn chủ đề bức thư & điệu nhạc du dương:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    {THEME_LIST.map((theme) => {
                      const isSelected = selectedTheme === theme.id;
                      return (
                        <div
                          key={theme.id}
                          onClick={() => handleThemeChange(theme.id)}
                          className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/15 shadow-sm scale-102 ring-2 ring-amber-400/20'
                              : isDarkMode
                                ? 'border-white/10 hover:border-white/20 bg-neutral-800/50'
                                : 'border-stone-200 hover:border-stone-300 bg-stone-50/70'
                          }`}
                        >
                          <span className="text-2xl block mb-1">{theme.emoji}</span>
                          <span className="font-serif font-bold text-xs block text-amber-700 dark:text-amber-300">
                            {theme.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CON DẤU SÁP DẬP NỔI MONOGRAM CÁ NHÂN HÓA */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Sparkles size={14} />
                        <span>Con Dấu Sáp Khắc Chữ Cái (Monogram Seal)</span>
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        In nổi chữ cái viết tắt tên bạn hoặc người nhận lên con dấu sáp 3D
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 font-serif font-black text-sm shadow-md border-2 border-white/30">
                      {waxMonogram || '✉️'}
                    </div>
                  </div>

                  <input
                    type="text"
                    maxLength={3}
                    value={waxMonogram}
                    onChange={(e) => setWaxMonogram(e.target.value.toUpperCase())}
                    placeholder="VD: ĐA, T, V, M... (tối đa 3 ký tự, để trống sẽ dùng icon mặc định)"
                    className={`w-full px-4 py-2 rounded-xl font-serif font-bold text-sm uppercase tracking-widest text-center ${inputCls}`}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClickSound();
                      setActiveStep(2);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-serif font-bold text-xs hover:bg-amber-400 cursor-pointer"
                  >
                    Tiếp: Viết tâm tình ➔
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: TÂM TÌNH & KỶ NIỆM (CONTENT & POLAROID) */}
            {activeStep === 2 && (
              <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 animate-fade-in ${cardCls}`}>
                <div>
                  <label className={labelCls}>Tiêu đề lá thư:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Một buổi sáng ấm áp dành cho bạn, Gửi người mình thương..."
                    className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm font-serif outline-none ${inputCls}`}
                  />
                </div>

                <div>
                  <label className={labelCls}>Lời chào mở đầu:</label>
                  <input
                    type="text"
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    placeholder={recipientName ? `Gửi ${recipientName},` : 'Gửi bạn thân mến,'}
                    className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm font-handwriting text-xl text-amber-700 dark:text-amber-300 outline-none ${inputCls}`}
                  />
                </div>

                {/* NGÂN HÀNG GỢI Ý CẢM XÚC KHI BÍ TỪ */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-amber-800 dark:text-amber-300">
                    <Lightbulb size={14} />
                    <span>Ngân hàng gợi ý cảm xúc (Bấm để chèn nhanh vào tâm thư):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(EMOTIONAL_PROMPTS[selectedTheme] || EMOTIONAL_PROMPTS.cute).map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleApplyPrompt(prompt.text)}
                        className="px-3 py-1 rounded-xl text-xs bg-white/80 dark:bg-neutral-800 border border-amber-400/30 hover:border-amber-500 text-neutral-800 dark:text-neutral-200 font-serif italic transition-all hover:scale-102 cursor-pointer shadow-2xs"
                        title={prompt.text}
                      >
                        + {prompt.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    Nội dung tâm thư (Tự do ngắt dòng để tạo từng đoạn thư trang nhã) <span className="text-rose-500">*</span>:
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hãy viết ra tất cả những điều bạn ấp ủ bấy lâu nay..."
                    className={`w-full mt-1.5 p-4 rounded-xl text-sm font-serif leading-relaxed outline-none resize-y ${inputCls}`}
                  />
                </div>

                {/* ẢNH POLAROID KỶ NIỆM */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className={labelCls}>Album Ảnh Kỷ Niệm (Phong cách Polaroid):</label>
                      <p className="text-[11px] text-neutral-400">Tự động nén siêu nhẹ, hiển thị xinh xắn có chú thích</p>
                    </div>

                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 text-xs font-serif font-bold cursor-pointer transition-colors">
                      <Camera size={14} />
                      <span>Thêm ảnh kỷ niệm</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {photos.map((p, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 shadow-xs space-y-2 relative">
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playClickSound();
                              setPhotos(photos.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 cursor-pointer"
                            title="Xóa ảnh"
                          >
                            <Trash2 size={13} />
                          </button>

                          <img src={p.url} alt="Kỷ niệm" className="w-full h-36 object-cover rounded-xl" />
                          <input
                            type="text"
                            value={p.caption}
                            onChange={(e) => {
                              const updated = [...photos];
                              updated[idx].caption = e.target.value;
                              setPhotos(updated);
                            }}
                            placeholder="Ghi chú tay dưới ảnh..."
                            className={`w-full px-3 py-1.5 rounded-lg text-xs font-handwriting text-base ${inputCls}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClickSound();
                      setActiveStep(1);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-serif text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  >
                    ⬅ Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClickSound();
                      setActiveStep(3);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-serif font-bold text-xs hover:bg-amber-400 cursor-pointer"
                  >
                    Tiếp: Quà tặng & Bảo mật ➔
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: QUÀ TẶNG BÍ MẬT & BẢO MẬT */}
            {activeStep === 3 && (
              <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 animate-fade-in ${cardCls}`}>
                {/* ĐIỀU CHƯA NÓI & LỜI NHẮN CUỐI */}
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Điều chưa nói (Khóa kín đáo ở đáy thư):</label>
                    <input
                      type="text"
                      value={secretUnsaid}
                      onChange={(e) => setSecretUnsaid(e.target.value)}
                      placeholder="VD: Thật ra mình luôn để ý bạn từ những thói quen nhỏ nhất..."
                      className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm font-serif italic outline-none ${inputCls}`}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Lời nhắn cuối cùng (Spotlight hiển thị khi đọc hết thư):</label>
                    <input
                      type="text"
                      value={finalThought}
                      onChange={(e) => setFinalThought(e.target.value)}
                      placeholder="VD: Mong bạn một đời bình an và luôn hạnh phúc nhé!"
                      className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm font-serif italic outline-none ${inputCls}`}
                    />
                  </div>
                </div>

                {/* MÓN QUÀ BÍ MẬT / LÌ XÌ SỐ (DIGITAL GIFT BOX) */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Gift size={15} />
                        <span>Đính kèm Hộp Quà Bí Mật / Lì Xì Số (Tùy chọn)</span>
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Người nhận được bóc phong bao nhận mã QR lì xì hoặc mã thẻ quà tặng
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={giftEnabled}
                      onChange={(e) => setGiftEnabled(e.target.checked)}
                      className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  {giftEnabled && (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Tiêu đề hộp quà:</label>
                          <input
                            type="text"
                            value={giftTitle}
                            onChange={(e) => setGiftTitle(e.target.value)}
                            placeholder="VD: Phong bao may mắn tặng bạn"
                            className={`w-full mt-1 px-3 py-2 rounded-xl text-xs ${inputCls}`}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Mã Voucher / Quà tặng (nếu có):</label>
                          <input
                            type="text"
                            value={giftVoucherCode}
                            onChange={(e) => setGiftVoucherCode(e.target.value)}
                            placeholder="VD: TANG-BAN-100K, PHUCLONG20..."
                            className={`w-full mt-1 px-3 py-2 rounded-xl text-xs font-mono font-bold ${inputCls}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Lời nhắn kèm quà:</label>
                        <input
                          type="text"
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          placeholder="VD: Chút quà nhỏ mua ly trà sữa ngọt ngào nhé!"
                          className={`w-full mt-1 px-3 py-2 rounded-xl text-xs font-serif italic ${inputCls}`}
                        />
                      </div>

                      {/* UPLOAD MÃ QR LÌ XÌ */}
                      <div>
                        <label className={labelCls}>Tải ảnh Mã QR Lì xì / Momo / VietQR:</label>
                        <div className="flex items-center gap-3 mt-1.5">
                          <label className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 text-xs font-serif font-bold cursor-pointer flex items-center gap-1.5">
                            <QrCode size={14} />
                            <span>{giftQrUrl ? 'Đổi ảnh QR khác' : 'Chọn ảnh QR'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleQrUpload}
                            />
                          </label>
                          {giftQrUrl && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <Check size={13} />
                              <span>Đã tải mã QR lên</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* KHÓA MẬT MÃ THƯ */}
                <div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Lock size={14} />
                        <span>Khóa Mật Khẩu Phong Bì (Tùy chọn)</span>
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Chỉ ai biết đúng mật mã bí mật mới mở được phong bì đọc thư
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={hasPassword}
                      onChange={(e) => setHasPassword(e.target.checked)}
                      className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  {hasPassword && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className={labelCls}>Mật khẩu mở thư:</label>
                        <input
                          type="text"
                          required={hasPassword}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="VD: ngaysinh, yeuthuong..."
                          className={`w-full mt-1 px-4 py-2 rounded-xl font-mono text-sm font-bold text-amber-600 dark:text-amber-300 outline-none ${inputCls}`}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Gợi ý mật khẩu cho người nhận:</label>
                        <input
                          type="text"
                          value={passwordHint}
                          onChange={(e) => setPasswordHint(e.target.value)}
                          placeholder="VD: Ngày đầu chúng mình gặp..."
                          className={`w-full mt-1 px-4 py-2 rounded-xl text-sm outline-none ${inputCls}`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* THỜI HẠN THƯ */}
                <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-white/10">
                  <label className={labelCls}>Thời gian hết hạn thư:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClickSound();
                        setExpiresAt('');
                      }}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                        !expiresAt
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400/30 font-bold'
                          : isDarkMode
                            ? 'bg-neutral-800/80 border-white/10 text-neutral-400'
                            : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      <InfinityIcon size={16} className="text-emerald-500" />
                      <div className="text-left">
                        <p className="text-xs font-serif font-bold">Không thời hạn</p>
                        <p className="text-[10px] opacity-75">Lưu giữ vĩnh viễn không bao giờ hết hạn</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClickSound();
                        if (!expiresAt) {
                          const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                          setExpiresAt(in7Days.toISOString().substring(0, 16));
                        }
                      }}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                        expiresAt
                          ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400/30 font-bold'
                          : isDarkMode
                            ? 'bg-neutral-800/80 border-white/10 text-neutral-400'
                            : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      <Calendar size={16} className="text-amber-500" />
                      <div className="text-left">
                        <p className="text-xs font-serif font-bold">Có thời hạn đóng thư</p>
                        <p className="text-[10px] opacity-75">Tự động khép lại sau ngày đã chọn</p>
                      </div>
                    </button>
                  </div>

                  {expiresAt && (
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onClick={(e) => {
                        try {
                          if (e.target?.showPicker) e.target.showPicker();
                        } catch {}
                      }}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className={`w-full mt-2 px-4 py-2.5 rounded-xl text-xs cursor-pointer ${inputCls}`}
                    />
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
                    {error}
                  </div>
                )}

                {/* SUBMIT BUTTONS */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClickSound();
                      setActiveStep(2);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-serif text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  >
                    ⬅ Quay lại
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Đang niêm phong thư...</span>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Niêm Phong & Gửi Lá Thư</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* NÚT XÓA BẢN NHÁP */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleClearDraft}
                className="text-xs text-neutral-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 size={12} />
                <span>Xóa làm lại từ đầu</span>
              </button>
            </div>

          </form>
        )}

      </div>

      {/* MODAL CHIA SẺ SAU KHI TẠO THÀNH CÔNG */}
      {createdLetter && (
        <ShareModal
          letter={createdLetter}
          isOpen={Boolean(createdLetter)}
          onClose={() => {
            setCreatedLetter(null);
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
}
