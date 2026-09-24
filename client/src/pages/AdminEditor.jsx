import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Sparkles,
  Lock,
  Music,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  Play,
  Square,
  KeyRound,
  CheckCircle,
  HelpCircle,
  FolderLock,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor
} from 'lucide-react';
import { THEME_LIST, getTheme } from '../types/theme';
import { PRESET_TRACKS, soundEngine } from '../audio/soundEngine';
import RecipientView from './RecipientView';

export default function AdminEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const adminToken = localStorage.getItem('admin_token') || '';

  // Chế độ Nền Sáng / Nền Tối & Âm Lượng
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);

  const handleToggleDarkMode = () => {
    soundEngine.playClickSound();
    setIsDarkMode(prev => !prev);
  };

  const handleVolumeChange = (newVal) => {
    const v = parseFloat(newVal);
    setVolume(v);
    soundEngine.setVolume(v);
    if (v > 0 && isMuted) {
      soundEngine.toggleMute();
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Tab điều hướng
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'theme' | 'security' | 'content' | 'photos' | 'music' | 'secrets'
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [playingPreviewMusic, setPlayingPreviewMusic] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    slug: '',
    recipientName: '',
    title: '',
    introQuote: 'Có một vài điều mình muốn bạn đọc thật chậm...',
    theme: 'tet',
    hasPassword: true,
    password: '',
    newPassword: '',
    passwordHint: '',
    content: {
      greeting: 'Gửi bạn,',
      paragraphs: ['Có những khoảnh khắc trong đời thật khó để diễn tả bằng lời...'],
      quotes: [
        {
          tag: '💭 Điều mình muốn nói',
          text: 'Cảm ơn bạn vì đã luôn là một phần dịu dàng trong cuộc sống của mình.'
        }
      ]
    },
    photos: [],
    music: {
      type: 'preset',
      track: 'tet_binh_an',
      customUrl: '',
      autoplay: true,
      defaultVolume: 0.3
    },
    secretUnsaid: {
      enabled: true,
      prompt: '💌 Có một điều mình chưa nói...',
      buttonText: 'Mở phần này',
      content: 'Mình thật lòng trân trọng từng phút giây được chuyện trò cùng bạn.'
    },
    finalThought: {
      enabled: true,
      prompt: 'Còn một điều cuối cùng...',
      content: 'Cảm ơn bạn vì đã đọc đến tận đây. Chúc bạn luôn an yên! ❤️'
    },
    expiresAt: ''
  });

  // Tải dữ liệu thư nếu đang ở chế độ chỉnh sửa
  useEffect(() => {
    if (!adminToken) {
      navigate('/admin');
      return;
    }

    if (isEditing) {
      fetch(`/api/letters/${id}`, {
        headers: { 'x-admin-key': adminToken }
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success && result.data) {
            const d = result.data;
            setFormData({
              slug: d.slug || d.id,
              recipientName: d.recipientName || '',
              title: d.title || '',
              introQuote: d.introQuote || '',
              theme: d.theme || 'tet',
              hasPassword: d.hasExistingPassword || false,
              password: '',
              newPassword: '',
              passwordHint: d.passwordHint || '',
              content: d.content || { greeting: '', paragraphs: [], quotes: [] },
              photos: d.photos || [],
              music: d.music || { type: 'preset', track: 'tet_binh_an', customUrl: '', defaultVolume: 0.4 },
              secretUnsaid: d.secretUnsaid || { enabled: false, prompt: '', buttonText: '', content: '' },
              finalThought: d.finalThought || { enabled: false, prompt: '', content: '' },
              expiresAt: d.expiresAt ? d.expiresAt.substring(0, 16) : ''
            });
          }
        })
        .catch((err) => console.error('Lỗi tải thư:', err));
    }
  }, [id, isEditing, adminToken, navigate]);

  // Dừng nhạc khi unmount
  useEffect(() => {
    return () => {
      soundEngine.stopBackgroundMusic();
    };
  }, []);

  // Xử lý lưu lá thư
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.recipientName.trim()) {
      alert('Vui lòng nhập tên người nhận.');
      setActiveTab('basic');
      return;
    }

    setSaving(true);
    soundEngine.playClickSound();

    const payload = {
      ...formData,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
    };

    try {
      const url = isEditing ? `/api/letters/${id}` : '/api/letters';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminToken
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok && result.success) {
        alert(isEditing ? 'Đã cập nhật lá thư thành công!' : 'Đã tạo lá thư mới thành công!');
        navigate('/admin');
      } else {
        alert(result.message || 'Lỗi khi lưu thư.');
      }
    } catch (err) {
      console.error('Lỗi khi lưu:', err);
      alert('Lỗi kết nối tới máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  // Tạo mật khẩu ngẫu nhiên dễ thương
  const handleGeneratePassword = () => {
    soundEngine.playClickSound();
    const words = ['traitim', 'binhyen', 'yeuthuong', 'dongday', 'kyniem', 'nucuoi', 'ngotngao', 'mayman'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    const generated = `${randomWord}${randomNum}`;
    setFormData({
      ...formData,
      password: generated,
      newPassword: generated,
      hasPassword: true
    });
  };

  // Xử lý upload ảnh
  const handleFileUpload = async (e, type = 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'x-admin-key': adminToken },
        body: data
      });
      const result = await res.json();
      if (res.ok && result.success) {
        if (type === 'image') {
          setFormData({
            ...formData,
            photos: [
              ...formData.photos,
              { url: result.url, caption: file.name.replace(/\.[^/.]+$/, ''), layout: 'polaroid' }
            ]
          });
        } else if (type === 'audio') {
          setFormData({
            ...formData,
            music: {
              ...formData.music,
              type: 'custom',
              customUrl: result.url
            }
          });
        }
      } else {
        alert(result.message || 'Lỗi khi tải file lên.');
      }
    } catch (err) {
      alert('Không thể tải file lên server lúc này.');
    }
  };

  // Nghe thử / dừng nhạc preset
  const handleTogglePreviewMusic = (track) => {
    soundEngine.playClickSound();
    if (playingPreviewMusic) {
      soundEngine.stopBackgroundMusic();
      setPlayingPreviewMusic(false);
    } else {
      soundEngine.startBackgroundMusic({ type: 'preset', track, defaultVolume: 0.3 });
      setPlayingPreviewMusic(true);
    }
  };

  // Quản lý đoạn văn
  const handleAddParagraph = () => {
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        paragraphs: [...formData.content.paragraphs, '']
      }
    });
  };

  const handleParagraphChange = (idx, value) => {
    const newParas = [...formData.content.paragraphs];
    newParas[idx] = value;
    setFormData({
      ...formData,
      content: { ...formData.content, paragraphs: newParas }
    });
  };

  const handleDeleteParagraph = (idx) => {
    const newParas = formData.content.paragraphs.filter((_, i) => i !== idx);
    setFormData({
      ...formData,
      content: { ...formData.content, paragraphs: newParas }
    });
  };

  // Quản lý Quotes
  const handleAddQuote = () => {
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        quotes: [
          ...formData.content.quotes,
          { tag: '💭 Điều mình muốn nói', text: '' }
        ]
      }
    });
  };

  const handleQuoteChange = (idx, field, value) => {
    const newQuotes = [...formData.content.quotes];
    newQuotes[idx] = { ...newQuotes[idx], [field]: value };
    setFormData({
      ...formData,
      content: { ...formData.content, quotes: newQuotes }
    });
  };

  const handleDeleteQuote = (idx) => {
    const newQuotes = formData.content.quotes.filter((_, i) => i !== idx);
    setFormData({
      ...formData,
      content: { ...formData.content, quotes: newQuotes }
    });
  };

  // Quản lý ảnh
  const handleDeletePhoto = (idx) => {
    const newPhotos = formData.photos.filter((_, i) => i !== idx);
    setFormData({ ...formData, photos: newPhotos });
  };

  const handlePhotoCaptionChange = (idx, caption) => {
    const newPhotos = [...formData.photos];
    newPhotos[idx].caption = caption;
    setFormData({ ...formData, photos: newPhotos });
  };

  // CHẾ ĐỘ XEM TRƯỚC TOÀN DIỆN (Simulator Preview)
  if (previewMode) {
    return (
      <div className="relative min-h-screen">
        {/* Nút thoát xem trước */}
        <button
          type="button"
          onClick={() => {
            soundEngine.stopBackgroundMusic();
            setPreviewMode(false);
          }}
          className="fixed top-5 left-5 z-50 px-4 py-2 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white text-xs font-serif border border-amber-400/40 shadow-2xl backdrop-blur-md flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Thoát Chế Độ Xem Trước</span>
        </button>

        <RecipientView
          previewData={{
            ...formData,
            id: 'preview-letter',
            slug: 'preview-letter',
            createdAt: new Date().toISOString()
          }}
        />
      </div>
    );
  }

  // Khóa màn hình nếu chưa đăng nhập Master Admin
  if (!adminToken) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${isDarkMode ? 'bg-neutral-950 text-white' : 'bg-stone-100 text-stone-900'}`}>
        <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl text-center ${isDarkMode ? 'bg-neutral-900 border-white/15' : 'bg-white border-stone-200'}`}>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-500">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-2">Khu Vực Quản Trị Đang Bị Khóa</h2>
          <p className="text-xs text-stone-500 dark:text-neutral-400 mb-6 font-serif italic">
            Bạn cần có quyền Quản trị viên (Master Admin) để truy cập và soạn thảo lá thư.
          </p>
          <Link
            to="/admin"
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm block transition-all shadow-md"
          >
            Đến Cổng Đăng Nhập Quản Trị
          </Link>
        </div>
      </div>
    );
  }

  // Bảng CSS thích ứng Nền Sáng / Nền Tối
  const inputCls = isDarkMode
    ? 'w-full px-4 py-3 rounded-xl bg-neutral-800/90 border border-white/10 text-white placeholder-neutral-500 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none transition-colors'
    : 'w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-colors shadow-xs';

  const smallInputCls = isDarkMode
    ? 'w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white text-xs font-serif focus:ring-2 focus:ring-amber-400 focus:outline-none'
    : 'w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-900 text-xs font-serif focus:bg-white focus:border-amber-500 focus:outline-none shadow-xs';

  const labelCls = isDarkMode
    ? 'block text-xs font-medium text-neutral-300 mb-1.5'
    : 'block text-xs font-medium text-stone-700 mb-1.5';

  const smallLabelCls = isDarkMode
    ? 'block text-[11px] text-neutral-400 mb-1'
    : 'block text-[11px] text-stone-500 mb-1';

  const cardCls = isDarkMode
    ? 'p-4 sm:p-5 rounded-2xl bg-neutral-800/80 border border-white/10 space-y-4'
    : 'p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4 shadow-xs';

  const headingCls = isDarkMode
    ? 'text-lg font-serif font-bold text-amber-300'
    : 'text-lg font-serif font-bold text-amber-800';

  const descCls = isDarkMode
    ? 'text-xs text-neutral-400'
    : 'text-xs text-stone-500';

  const hintCls = isDarkMode
    ? 'text-[11px] text-neutral-500 mt-1 block'
    : 'text-[11px] text-stone-500 mt-1 block';

  return (
    <div className={`min-h-screen transition-colors duration-500 p-4 sm:p-8 ${
      isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#faf8f5] text-neutral-900'
    }`}>
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* THANH ĐIỀU HƯỚNG ĐẦU TRANG */}
        <header className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 transition-colors ${
          isDarkMode ? 'border-white/10' : 'border-neutral-200'
        }`}>
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className={`p-2.5 rounded-xl transition-colors ${
                isDarkMode ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-white hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 border border-neutral-300 shadow-xs'
              }`}
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className={`text-2xl font-serif font-bold ${
                isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}>
                {isEditing ? 'Chỉnh Sửa Lá Thư' : 'Soạn Thảo Lá Thư Mới'}
              </h1>
              <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Chuẩn bị trọn vẹn từng chi tiết cảm xúc trước khi gửi tặng
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* TOUCH BUTTON CHUYỂN ĐỔI: NỀN SÁNG ☀️ / NỀN TỐI 🌙 */}
            <button
              type="button"
              onClick={handleToggleDarkMode}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-sans font-medium transition-all shadow-xs cursor-pointer ${
                isDarkMode
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-400/30'
                  : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 shadow-xs'
              }`}
              title={isDarkMode ? 'Chạm để chuyển sang Nền Sáng ☀️' : 'Chạm để chuyển sang Nền Tối 🌙'}
            >
              {isDarkMode ? (
                <>
                  <Moon size={14} className="text-sky-300" />
                  <span className="hidden xs:inline">Nền Tối</span>
                </>
              ) : (
                <>
                  <Sun size={14} className="text-amber-500" />
                  <span className="hidden xs:inline">Nền Sáng</span>
                </>
              )}
            </button>

            {/* BỘ ĐIỀU CHỈNH ÂM LƯỢNG */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleMute}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-white/10'
                    : 'bg-white hover:bg-neutral-100 text-amber-700 border border-neutral-300 shadow-xs'
                }`}
                title={isMuted ? 'Đang tắt âm thanh (Chạm để bật)' : 'Bật/Tắt âm thanh'}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${
                isDarkMode ? 'bg-neutral-900 border border-white/10' : 'bg-white border border-neutral-300 shadow-xs'
              }`}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  className="w-16 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                />
              </div>
            </div>

            {/* NÚT XEM 2 MÀN HÌNH (MOBILE + LAPTOP) */}
            <Link
              to="/dual"
              onClick={() => soundEngine.playClickSound()}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-sans transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/10'
                  : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 shadow-xs'
              }`}
              title="Xem giao diện đồng thời trên Điện thoại & Laptop"
            >
              <Smartphone size={13} className="text-amber-500" />
              <Monitor size={13} className="text-sky-500 -ml-0.5" />
              <span className="hidden sm:inline">2 Màn hình</span>
            </Link>

            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-serif font-semibold transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border-white/10'
                  : 'bg-white hover:bg-neutral-100 text-amber-800 border-neutral-300 shadow-xs'
              }`}
            >
              <Eye size={15} />
              <span>Xem Trước</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 font-serif font-bold text-xs shadow-md hover:shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              <span>{saving ? 'Đang lưu...' : 'Lưu Lá Thư'}</span>
            </button>
          </div>
        </header>

        {/* CÁC TABS CẤU HÌNH */}
        <div className={`flex items-center gap-2 overflow-x-auto pb-2 border-b ${
          isDarkMode ? 'border-white/10' : 'border-neutral-200'
        }`}>
          {[
            { id: 'basic', label: '1. Thông tin chung' },
            { id: 'theme', label: '2. Chọn Theme (4 chủ đề)' },
            { id: 'security', label: '3. Khóa & Mật khẩu' },
            { id: 'content', label: '4. Nội dung thư' },
            { id: 'photos', label: '5. Kỷ niệm & Ảnh' },
            { id: 'music', label: '6. Nhạc nền' },
            { id: 'secrets', label: '7. Bất ngờ cuối thư' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundEngine.playClickSound();
                setActiveTab(tab.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : isDarkMode
                    ? 'bg-neutral-900 text-neutral-400 hover:text-white'
                    : 'bg-white text-neutral-600 hover:text-neutral-950 border border-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* NỘI DUNG TỪNG TAB */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 transition-colors ${
          isDarkMode ? 'bg-neutral-900/90 border-white/10 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900 shadow-xs'
        }`}>

          {/* TAB 1: THÔNG TIN CƠ BẢN */}
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <h2 className={headingCls}>Thông Tin Lá Thư</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>
                    Tên người nhận <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="VD: Hà Phương, Bố Mẹ, Minh Anh..."
                    className={inputCls}
                  />
                  <span className={hintCls}>Tên hiển thị trang trọng trên phong bì thư</span>
                </div>

                <div>
                  <label className={labelCls}>
                    Mã đường dẫn (Slug URL)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="VD: noel-ha-phuong (để trống sẽ tự tạo)"
                    className={`${inputCls} font-mono`}
                  />
                  <span className={hintCls}>Đường link người nhận truy cập: /letter/[slug]</span>
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Tiêu đề lá thư
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Giáng Sinh Ấm Áp Dành Cho Em"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Lời đề tựa ngoài phong bì (Teaser Quote)
                </label>
                <input
                  type="text"
                  value={formData.introQuote}
                  onChange={(e) => setFormData({ ...formData, introQuote: e.target.value })}
                  placeholder="VD: Có một vài điều mình muốn bạn đọc thật chậm..."
                  className={`${inputCls} font-serif italic`}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Ngày hết hạn thư (Tùy chọn)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className={inputCls}
                />
                <span className={hintCls}>Sau thời điểm này, người nhận sẽ thấy màn hình thông báo thư đã khép lại</span>
              </div>
            </div>
          )}

          {/* TAB 2: CHỌN THEME (4 CHỦ ĐỀ) */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <h2 className={`text-lg font-serif font-bold ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                  Bộ Sưu Tập 4 Chủ Đề Cốt Lõi
                </h2>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Mỗi chủ đề sẽ tự động thay đổi phong bì, con dấu sáp, bài nhạc nền MP3 riêng biệt và hiệu ứng hạt tương ứng.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {THEME_LIST.map((theme) => {
                  const isSelected = formData.theme === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => {
                        soundEngine.playClickSound();
                        setFormData({
                          ...formData,
                          theme: theme.id,
                          music: {
                            ...formData.music,
                            track: theme.defaultMusic || formData.music.track
                          }
                        });
                      }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]'
                          : isDarkMode
                            ? 'bg-neutral-800/60 border-white/10 hover:border-white/25'
                            : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-3xl">{theme.emoji}</span>
                          <div className="flex items-center gap-1.5">
                            {isSelected && <CheckCircle size={18} className="text-amber-500" />}
                          </div>
                        </div>
                        <h3 className={`font-serif font-bold text-base ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>{theme.name}</h3>
                        <p className={`text-xs mt-1 font-serif line-clamp-2 italic ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          {theme.tagline}
                        </p>
                      </div>

                      {/* Thanh màu thực tế của chủ đề */}
                      <div className="w-full flex items-center gap-1 my-2.5 px-1 py-1 rounded bg-black/20 dark:bg-black/40">
                        {theme.previewColors?.map((col, idx) => (
                          <div 
                            key={idx} 
                            className="flex-1 h-2 rounded-xs border border-white/20"
                            style={{ backgroundColor: col }}
                            title={col}
                          />
                        ))}
                      </div>

                      <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                        isDarkMode ? 'border-white/10 text-neutral-400' : 'border-neutral-200 text-neutral-600'
                      }`}>
                        <span>Hạt: {theme.particleType}</span>
                        <span>Dấu: {theme.envelope?.sealType || 'sáp'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BẢO MẬT & MẬT KHẨU */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className={headingCls}>Khóa & Bảo Mật Thư</h2>
                <p className={descCls}>
                  Nội dung thư và hình ảnh sẽ được mã hóa trên máy chủ và chỉ trả về khi người nhận nhập đúng mật khẩu.
                </p>
              </div>

              <div className={cardCls}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lock size={18} className="text-amber-500" />
                    <div>
                      <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>Bật khóa mật khẩu</span>
                      <p className={descCls}>Yêu cầu người nhận nhập mật khẩu trước khi mở phong bì</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.hasPassword}
                    onChange={(e) => setFormData({ ...formData, hasPassword: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                {formData.hasPassword && (
                  <div className={`pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-stone-200'} space-y-4`}>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={labelCls}>
                          {isEditing ? 'Đặt mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu mở thư'}
                        </label>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <KeyRound size={12} />
                          <span>Tự sinh mật khẩu dễ thương</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        value={isEditing ? formData.newPassword : formData.password}
                        onChange={(e) => {
                          if (isEditing) setFormData({ ...formData, newPassword: e.target.value });
                          else setFormData({ ...formData, password: e.target.value });
                        }}
                        placeholder="VD: noel2024, happy, ngaysinh123..."
                        className={`${inputCls} font-mono text-amber-600 dark:text-amber-300 font-bold`}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>
                        Gợi ý mật khẩu cho người nhận (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={formData.passwordHint}
                        onChange={(e) => setFormData({ ...formData, passwordHint: e.target.value })}
                        placeholder="VD: Biệt danh của cậu, Ngày chúng mình gặp nhau..."
                        className={inputCls}
                      />
                      <span className={hintCls}>
                        Gợi ý này sẽ hiển thị tinh tế dưới ô nhập mật khẩu để giúp người nhận nhớ ra
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: NỘI DUNG THƯ */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={headingCls}>Nội Dung Lá Thư</h2>
                  <p className={descCls}>Các đoạn văn và câu trích dẫn tâm tư sẽ lần lượt xuất hiện khi người nhận cuộn thư</p>
                </div>
              </div>

              {/* Lời chào */}
              <div>
                <label className={labelCls}>
                  Lời mở đầu / Chào hỏi
                </label>
                <input
                  type="text"
                  value={formData.content.greeting}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, greeting: e.target.value }
                    })
                  }
                  placeholder="VD: Gửi Hà Phương thương mến,"
                  className={`${inputCls} font-serif text-base font-medium`}
                />
              </div>

              {/* Danh sách các đoạn văn */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>Các đoạn văn chính:</label>
                  <button
                    type="button"
                    onClick={handleAddParagraph}
                    className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-medium"
                  >
                    <Plus size={14} />
                    <span>Thêm đoạn văn</span>
                  </button>
                </div>

                {formData.content.paragraphs.map((para, idx) => (
                  <div key={idx} className="relative flex items-start gap-2">
                    <textarea
                      rows={3}
                      value={para}
                      onChange={(e) => handleParagraphChange(idx, e.target.value)}
                      placeholder={`Nội dung đoạn văn ${idx + 1}...`}
                      className={`${inputCls} font-serif text-sm leading-relaxed`}
                    />
                    {formData.content.paragraphs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteParagraph(idx)}
                        className={`p-2.5 rounded-xl transition-colors ${
                          isDarkMode
                            ? 'bg-neutral-800 hover:bg-rose-600 text-neutral-400 hover:text-white'
                            : 'bg-stone-100 hover:bg-rose-600 text-stone-500 hover:text-white border border-stone-200'
                        }`}
                        title="Xóa đoạn văn"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Danh sách các Quotes / Tâm tư nổi bật */}
              <div className={`space-y-4 pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-stone-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <label className={labelCls}>Thẻ tâm tư nổi bật (Quotes & Highlights):</label>
                    <p className={descCls}>Hiển thị trong khung viền trang trọng với emoji</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddQuote}
                    className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-medium"
                  >
                    <Plus size={14} />
                    <span>Thêm thẻ tâm tư</span>
                  </button>
                </div>

                {formData.content.quotes.map((q, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border space-y-3 ${
                      isDarkMode ? 'bg-neutral-800/70 border-white/10' : 'bg-stone-50 border-stone-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={q.tag}
                        onChange={(e) => handleQuoteChange(idx, 'tag', e.target.value)}
                        placeholder="VD: 💭 Điều mình muốn nói, 🌱 Điều mình mong..."
                        className={`px-3 py-1.5 rounded-lg border font-serif text-xs font-bold w-64 ${
                          isDarkMode
                            ? 'bg-neutral-900 border-white/10 text-amber-300'
                            : 'bg-white border-stone-200 text-amber-800 shadow-xs'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteQuote(idx)}
                        className="p-1.5 text-neutral-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={q.text}
                      onChange={(e) => handleQuoteChange(idx, 'text', e.target.value)}
                      placeholder="Nội dung tâm tư..."
                      className={`w-full p-3 rounded-lg border font-serif italic text-xs leading-relaxed ${
                        isDarkMode
                          ? 'bg-neutral-900 border-white/10 text-white'
                          : 'bg-white border-stone-200 text-stone-900 shadow-xs'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: HÌNH ẢNH & KỶ NIỆM */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              <div>
                <h2 className={headingCls}>Hình Ảnh & Kỷ Niệm (Polaroid)</h2>
                <p className={descCls}>
                  Tải lên ảnh từ máy tính hoặc nhập link ảnh. Mỗi ảnh sẽ được lồng vào khung Polaroid nghệ thuật kèm chữ viết tay và chế độ phóng to Lightbox.
                </p>
              </div>

              {/* Nút Upload ảnh */}
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs cursor-pointer shadow-md transition-all">
                  <Upload size={16} />
                  <span>Tải ảnh lên từ máy</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'image')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Danh sách ảnh đã tải */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {formData.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isDarkMode ? 'bg-neutral-800/80 border-white/10' : 'bg-stone-50 border-stone-200 shadow-xs'
                    }`}
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-900">
                      <img src={photo.url} alt="Kỷ niệm" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(idx)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-rose-900/80 text-white hover:bg-rose-800 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div>
                      <label className={smallLabelCls}>Chú thích viết tay (Caption):</label>
                      <input
                        type="text"
                        value={photo.caption}
                        onChange={(e) => handlePhotoCaptionChange(idx, e.target.value)}
                        placeholder="VD: 📸 Một ngày rất đáng nhớ..."
                        className={`w-full px-3 py-2 rounded-lg border font-handwriting text-base ${
                          isDarkMode
                            ? 'bg-neutral-900 border-white/10 text-white'
                            : 'bg-white border-stone-200 text-stone-900 shadow-xs'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: NHẠC NỀN */}
          {activeTab === 'music' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className={headingCls}>Nhạc Nền Lá Thư</h2>
                <p className={descCls}>
                  Nhạc sẽ tự động fade-in nhẹ nhàng khi người nhận mở khóa phong bì. Âm lượng mặc định êm dịu, không làm giật mình.
                </p>
              </div>

              {/* Bộ preset nhạc Web Audio tích hợp */}
              <div className="space-y-3">
                <label className={labelCls}>Danh sách nhạc êm dịu có sẵn:</label>
                <div className="space-y-2">
                  {PRESET_TRACKS.map((track) => {
                    const isSelected = formData.music.track === track.id;
                    return (
                      <div
                        key={track.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-amber-900 dark:text-white shadow-xs ring-1 ring-amber-400/40'
                            : isDarkMode
                              ? 'bg-neutral-800/60 border-white/5 text-neutral-300'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div
                          className="cursor-pointer flex-1"
                          onClick={() => {
                            soundEngine.playClickSound();
                            setFormData({
                              ...formData,
                              music: { ...formData.music, track: track.id, type: 'preset' }
                            });
                          }}
                        >
                          <span className={`text-sm font-serif font-bold block ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>{track.name}</span>
                          <span className={`text-xs italic ${isDarkMode ? 'text-neutral-400' : 'text-stone-500'}`}>{track.mood}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTogglePreviewMusic(track.id)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            isDarkMode
                              ? 'bg-neutral-700 hover:bg-amber-500 hover:text-neutral-950 text-neutral-300'
                              : 'bg-stone-200 hover:bg-amber-500 hover:text-neutral-950 text-stone-700'
                          }`}
                          title="Nghe thử"
                        >
                          {playingPreviewMusic && formData.music.track === track.id ? (
                            <Square size={14} className="fill-current" />
                          ) : (
                            <Play size={14} className="fill-current" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tải lên file nhạc MP3 riêng */}
              <div className={`pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-stone-200'} space-y-3`}>
                <label className={labelCls}>
                  Hoặc tải lên file MP3 tùy chọn của bạn:
                </label>
                <div className="flex items-center gap-3">
                  <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-serif cursor-pointer border transition-all ${
                    isDarkMode
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-white/10'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200 shadow-xs'
                  }`}>
                    <Upload size={14} />
                    <span>Chọn file MP3</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileUpload(e, 'audio')}
                      className="hidden"
                    />
                  </label>
                  {formData.music.customUrl && (
                    <span className="text-xs text-emerald-500 dark:text-emerald-400 font-mono truncate max-w-xs font-medium">
                      Đã chọn: {formData.music.customUrl}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BẤT NGỜ CUỐI THƯ */}
          {activeTab === 'secrets' && (
            <div className="space-y-8 max-w-xl">
              
              {/* Điều chưa nói */}
              <div className={cardCls}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-serif font-bold text-sm ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>💌 Điều Chưa Nói (The Unsaid Secret)</h3>
                    <p className={descCls}>Một phong bì con được niêm phong, người nhận phải bấm để bóc mở</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.secretUnsaid.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        secretUnsaid: { ...formData.secretUnsaid, enabled: e.target.checked }
                      })
                    }
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                {formData.secretUnsaid.enabled && (
                  <div className={`space-y-3 pt-3 border-t ${isDarkMode ? 'border-white/10' : 'border-stone-200'}`}>
                    <div>
                      <label className={smallLabelCls}>Dòng chữ trên phong bì con:</label>
                      <input
                        type="text"
                        value={formData.secretUnsaid.prompt}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            secretUnsaid: { ...formData.secretUnsaid, prompt: e.target.value }
                          })
                        }
                        className={smallInputCls}
                      />
                    </div>
                    <div>
                      <label className={smallLabelCls}>Nội dung bí mật được hé lộ:</label>
                      <textarea
                        rows={3}
                        value={formData.secretUnsaid.content}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            secretUnsaid: { ...formData.secretUnsaid, content: e.target.value }
                          })
                        }
                        placeholder="Nội dung điều chưa nói..."
                        className={`w-full p-3 rounded-lg border text-xs font-serif italic ${
                          isDarkMode
                            ? 'bg-neutral-900 border-white/10 text-white'
                            : 'bg-white border-stone-200 text-stone-900 shadow-xs'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Điều cuối cùng */}
              <div className={cardCls}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-serif font-bold text-sm ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>✨ Điều Cuối Cùng (Final Thought)</h3>
                    <p className={descCls}>Chiếc thẻ cuối trang, khi bấm vào sẽ làm tối nền và chiếu spotlight vào lời kết</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.finalThought.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        finalThought: { ...formData.finalThought, enabled: e.target.checked }
                      })
                    }
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                {formData.finalThought.enabled && (
                  <div className={`space-y-3 pt-3 border-t ${isDarkMode ? 'border-white/10' : 'border-stone-200'}`}>
                    <div>
                      <label className={smallLabelCls}>Lời dẫn thẻ:</label>
                      <input
                        type="text"
                        value={formData.finalThought.prompt}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            finalThought: { ...formData.finalThought, prompt: e.target.value }
                          })
                        }
                        className={smallInputCls}
                      />
                    </div>
                    <div>
                      <label className={smallLabelCls}>Lời nhắn cuối cùng khi bừng sáng:</label>
                      <textarea
                        rows={3}
                        value={formData.finalThought.content}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            finalThought: { ...formData.finalThought, content: e.target.value }
                          })
                        }
                        placeholder="VD: Cảm ơn bạn vì đã đọc đến tận đây. Chúc bạn luôn rực rỡ và hạnh phúc! ❤️"
                        className={`w-full p-3 rounded-lg border text-xs font-serif italic ${
                          isDarkMode
                            ? 'bg-neutral-900 border-white/10 text-white'
                            : 'bg-white border-stone-200 text-stone-900 shadow-xs'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
