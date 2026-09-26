import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Smartphone,
  QrCode as QrIcon,
  Copy,
  Check,
  Download,
  Upload,
  Cloud,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileJson
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { copyToClipboard } from '../utils/url';
import {
  getSyncPayload,
  generateSyncUrl,
  importSyncPayload,
  encodeBase64Utf8,
  decodeBase64Utf8
} from '../api/mockAdapter';

export default function DeviceSyncModal({ isOpen, onClose, isDarkMode }) {
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'backup' | 'cloud'
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [syncUrl, setSyncUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);

  // Thống kê dữ liệu hiện tại trên thiết bị
  const [userList, setUserList] = useState([]);
  const [letterCount, setLetterCount] = useState(0);

  // Cloud DB (Firebase)
  const [cloudDbUrl, setCloudDbUrl] = useState(localStorage.getItem('gh_cloud_db_url') || '');
  const [cloudSaving, setCloudSaving] = useState(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState('');

  // Nhập dữ liệu thủ công
  const [importCodeInput, setImportCodeInput] = useState('');
  const [importStatusMsg, setImportStatusMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Lấy thông tin thống kê hiện tại
    const payload = getSyncPayload();
    const members = (payload.users || []).filter(
      (u) => u.role !== 'admin' && u.username !== 'admin' && u.username !== 'tiendat'
    );
    setUserList(members);
    setLetterCount((payload.letters || []).length);

    // Tạo link đồng bộ
    try {
      const url = generateSyncUrl();
      setSyncUrl(url);

      QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        }
      })
        .then((dataUrl) => setQrCodeDataUrl(dataUrl))
        .catch((err) => console.error('Lỗi sinh mã QR đồng bộ:', err));
    } catch (err) {
      console.error('Lỗi chuẩn bị link đồng bộ:', err);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Sao chép link đồng bộ
  const handleCopySyncLink = async () => {
    soundEngine.playClickSound();
    await copyToClipboard(syncUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Tải file backup JSON
  const handleDownloadBackup = () => {
    soundEngine.playClickSound();
    const payload = getSyncPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secretletter_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Nhập file backup JSON
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playClickSound();
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const result = importSyncPayload(json);
        setImportStatusMsg(
          `✓ Nhập thành công! Đã nạp ${result.importedUsers} tài khoản và ${result.importedLetters} lá thư.`
        );
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        setImportStatusMsg('❌ File JSON không đúng định dạng. Vui lòng thử lại.');
      }
    };
    reader.readAsText(file);
  };

  // Nhập mã đồng bộ dán trực tiếp
  const handleImportByCode = (e) => {
    e.preventDefault();
    if (!importCodeInput.trim()) return;

    soundEngine.playClickSound();
    try {
      let json = null;
      let raw = importCodeInput.trim();

      // Nếu người dùng dán cả đường link kèm ?sync=...
      if (raw.includes('?sync=')) {
        raw = raw.split('?sync=')[1].split('&')[0];
      }

      try {
        json = decodeBase64Utf8(raw);
      } catch {
        json = JSON.parse(raw);
      }

      if (typeof json === 'string') {
        json = JSON.parse(json);
      }

      const result = importSyncPayload(json);
      setImportStatusMsg(
        `✓ Đồng bộ thành công! Đã nạp ${result.importedUsers} tài khoản. Hệ thống đang tải lại...`
      );
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setImportStatusMsg('❌ Mã đồng bộ không hợp lệ. Vui lòng kiểm tra lại.');
    }
  };

  // Lưu URL Firebase Realtime Database
  const handleSaveCloudUrl = async (e) => {
    e.preventDefault();
    soundEngine.playClickSound();
    setCloudSaving(true);
    setCloudStatusMsg('');

    const cleanUrl = cloudDbUrl.trim().replace(/\/$/, '');
    if (!cleanUrl) {
      localStorage.removeItem('gh_cloud_db_url');
      setCloudStatusMsg('✓ Đã tắt kết nối đám mây, trở về chế độ LocalStorage.');
      setCloudSaving(false);
      return;
    }

    try {
      // Test kết nối bằng cách PUT dữ liệu hiện tại lên Firebase
      const payload = getSyncPayload();
      const testRes = await fetch(`${cleanUrl}/secretletter.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          updatedAt: new Date().toISOString()
        })
      });

      if (testRes.ok) {
        localStorage.setItem('gh_cloud_db_url', cleanUrl);
        setCloudStatusMsg('🎉 Kết nối Firebase Realtime Database thành công! Tất cả thiết bị đã được kích hoạt đồng bộ tự động 24/7.');
      } else {
        setCloudStatusMsg('❌ Không thể ghi dữ liệu vào Firebase URL này. Vui lòng kiểm tra lại Rules hoặc địa chỉ.');
      }
    } catch (err) {
      setCloudStatusMsg('❌ Lỗi kết nối tới URL này. Đảm bảo URL có dạng https://<project-id>-default-rtdb.firebaseio.com');
    } finally {
      setCloudSaving(false);
    }
  };

  // Style classes
  const modalBoxCls = isDarkMode
    ? 'bg-neutral-900 border-white/10 text-neutral-100 shadow-2xl'
    : 'bg-white border-neutral-200 text-neutral-900 shadow-2xl';
  const tabBtnCls = (active) =>
    `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer ${
      active
        ? 'bg-amber-500 text-neutral-950 shadow-md'
        : isDarkMode
          ? 'bg-neutral-800 text-neutral-400 hover:text-white'
          : 'bg-stone-100 text-stone-600 hover:text-stone-900'
    }`;
  const inputCls = isDarkMode
    ? 'bg-neutral-800 border-white/10 text-white placeholder-neutral-500 focus:border-amber-400'
    : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400 focus:bg-white focus:border-amber-500';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
    >
      <div className={`max-w-2xl w-full p-6 sm:p-8 rounded-3xl border space-y-6 my-8 ${modalBoxCls}`}>
        {/* HEADER */}
        <div className="flex items-center justify-between border-b pb-4 border-white/10 dark:border-white/10 border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Smartphone size={22} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <span>Đồng Bộ Thiết Bị & Đám Mây</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Chuyển tài khoản đã tạo trên máy tính sang điện thoại dễ dàng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isDarkMode
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
            }`}
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* THÔNG BÁO TÓM TẮT DỮ LIỆU HIỆN CÓ TRÊN MÁY TÍNH */}
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="space-y-0.5">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck size={15} />
              <span>Dữ liệu sẵn sàng chuyển giao:</span>
            </span>
            <p className="opacity-90">
              Hiện có <strong>{userList.length} tài khoản thành viên</strong> ({userList.map((u) => u.username).join(', ') || 'Chưa có'}) và <strong>{letterCount} lá thư</strong>.
            </p>
          </div>
          <span className="shrink-0 px-2 py-1 rounded-lg font-mono font-bold bg-amber-500/20 text-[11px]">
            {userList.length} Users
          </span>
        </div>

        {/* NÚT CHUYỂN ĐỔI 3 TAB ĐỒNG BỘ */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClickSound();
              setActiveTab('qr');
            }}
            className={tabBtnCls(activeTab === 'qr')}
          >
            <QrIcon size={14} />
            <span>1. Quét QR / Gửi Link Sang ĐT</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClickSound();
              setActiveTab('backup');
            }}
            className={tabBtnCls(activeTab === 'backup')}
          >
            <FileJson size={14} />
            <span>2. Sao Lưu & File JSON</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClickSound();
              setActiveTab('cloud');
            }}
            className={tabBtnCls(activeTab === 'cloud')}
          >
            <Cloud size={14} />
            <span>3. Tự Động 24/7 (Đám Mây)</span>
          </button>
        </div>

        {/* ================= TAB 1: QUÉT QR HOẶC GỬI LINK ================= */}
        {activeTab === 'qr' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* KHUNG HIỂN THỊ MÃ QR */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white text-neutral-900 border border-neutral-300 shadow-md">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Mã QR Đồng Bộ Thiết Bị"
                    className="w-56 h-56 rounded-xl object-contain shadow-inner"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-xs text-neutral-400">
                    Đang tạo mã QR...
                  </div>
                )}
                <span className="text-[11px] font-serif font-semibold text-neutral-600 mt-2 text-center">
                  Mở camera điện thoại quét mã này
                </span>
              </div>

              {/* HƯỚNG DẪN & NÚT SAO CHÉP LINK */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-sm text-amber-600 dark:text-amber-400">
                    📱 3 Bước đơn giản để điện thoại nhận ngay tài khoản:
                  </h3>
                  <ol className="text-xs space-y-1.5 pl-4 list-decimal text-neutral-600 dark:text-neutral-400">
                    <li>
                      Mở ứng dụng <strong>Camera</strong> trên điện thoại và rọi vào mã QR bên cạnh.
                    </li>
                    <li>
                      Bấm vào thông báo vàng hiện lên để mở liên kết trên trình duyệt điện thoại.
                    </li>
                    <li>
                      Website sẽ <strong>tự động nạp toàn bộ tài khoản</strong> vào điện thoại và bạn có thể đăng nhập ngay!
                    </li>
                  </ol>
                </div>

                <div className="pt-2 space-y-2 border-t border-neutral-200 dark:border-white/10">
                  <span className="text-xs font-serif font-medium block">
                    Hoặc sao chép link gửi qua Zalo / Messenger cho chính bạn hoặc bạn bè:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySyncLink}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedLink ? 'Đã Sao Chép Link Thành Công!' : 'Sao Chép Link Đồng Bộ Sang ĐT'}</span>
                  </button>
                  <p className="text-[11px] italic text-neutral-500 text-center">
                    Mở link này trên bất kỳ điện thoại nào đều sẽ tự nạp tài khoản ngay lập tức.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: SAO LƯU & FILE JSON ================= */}
        {activeTab === 'backup' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TẢI FILE BACKUP */}
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  isDarkMode ? 'bg-neutral-800/60 border-white/10' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-serif font-bold text-sm">
                  <Download size={16} />
                  <span>1. Tải File Dữ Liệu Dự Phòng</span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Xuất toàn bộ danh sách tài khoản, các lá thư và Vibe Hub ra file <code>.json</code> để lưu trữ an toàn hoặc chuyển sang thiết bị khác.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-serif font-bold text-xs hover:opacity-90 cursor-pointer shadow-xs"
                >
                  <Download size={14} />
                  <span>Tải File .json Về Máy</span>
                </button>
              </div>

              {/* NHẬP FILE BACKUP */}
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  isDarkMode ? 'bg-neutral-800/60 border-white/10' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-serif font-bold text-sm">
                  <Upload size={16} />
                  <span>2. Nạp File Dữ Liệu Lên</span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Nếu bạn đang mở web trên điện thoại, hãy chọn file <code>.json</code> đã tải từ máy tính để khôi phục toàn bộ tài khoản.
                </p>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs cursor-pointer shadow-xs">
                  <Upload size={14} />
                  <span>Chọn File .json Để Nạp</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* DÁN MÃ ĐỒNG BỘ TRỰC TIẾP */}
            <form onSubmit={handleImportByCode} className="space-y-3 pt-2 border-t border-neutral-200 dark:border-white/10">
              <label className="text-xs font-serif font-medium block">
                Hoặc dán trực tiếp mã đồng bộ (hoặc đường link) vào đây:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={importCodeInput}
                  onChange={(e) => setImportCodeInput(e.target.value)}
                  placeholder="Dán mã hoặc link ?sync=... vào đây"
                  className={`flex-1 px-4 py-2 rounded-xl text-xs outline-none ${inputCls}`}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs cursor-pointer shadow-xs"
                >
                  Nạp Ngay
                </button>
              </div>
              {importStatusMsg && (
                <p className="text-xs font-serif font-semibold text-emerald-600 dark:text-emerald-400">
                  {importStatusMsg}
                </p>
              )}
            </form>
          </div>
        )}

        {/* ================= TAB 3: ĐÁM MÂY TỰ ĐỘNG 24/7 (FIREBASE) ================= */}
        {activeTab === 'cloud' && (
          <div className="space-y-5">
            <div
              className={`p-4 rounded-2xl border space-y-2 text-xs leading-relaxed ${
                isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <span className="font-bold flex items-center gap-1.5 text-sm">
                <Cloud size={16} />
                <span>Đồng bộ Đám mây Tự động 24/7 (Google Firebase Miễn Phí)</span>
              </span>
              <p>
                Khi kết nối Firebase Realtime Database, mọi tài khoản bạn tạo, thư gửi đi hay mở khóa đều tự động đồng bộ tức thì trên toàn bộ điện thoại và máy tính mà <strong>không cần phải quét QR hay gửi link thủ công</strong>!
              </p>
            </div>

            <form onSubmit={handleSaveCloudUrl} className="space-y-4">
              <div>
                <label className="text-xs font-serif font-medium block mb-1">
                  Địa chỉ Firebase Realtime Database URL:
                </label>
                <input
                  type="url"
                  value={cloudDbUrl}
                  onChange={(e) => setCloudDbUrl(e.target.value)}
                  placeholder="https://secretletter-xxxx-default-rtdb.firebaseio.com"
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-mono outline-none ${inputCls}`}
                />
                <span className="text-[11px] mt-1 block text-neutral-500">
                  Ví dụ: <code>https://my-secretletter-default-rtdb.firebaseio.com</code>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={cloudSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-serif font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {cloudSaving ? <RefreshCw size={15} className="animate-spin" /> : <Cloud size={15} />}
                  <span>{cloudSaving ? 'Đang kiểm tra kết nối...' : 'Lưu & Kích Hoạt Đồng Bộ Đám Mây'}</span>
                </button>
              </div>

              {cloudStatusMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs font-serif font-medium ${
                    cloudStatusMsg.startsWith('🎉') || cloudStatusMsg.startsWith('✓')
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {cloudStatusMsg}
                </div>
              )}
            </form>

            <div className="p-4 rounded-2xl border border-dashed border-neutral-300 dark:border-white/10 text-xs space-y-2">
              <span className="font-bold block text-neutral-700 dark:text-neutral-300">
                💡 Hướng dẫn tạo Firebase Realtime Database miễn phí trong 1 phút:
              </span>
              <ol className="pl-4 list-decimal space-y-1 text-neutral-600 dark:text-neutral-400">
                <li>Truy cập <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline text-amber-600">console.firebase.google.com</a> và đăng nhập bằng tài khoản Google.</li>
                <li>Tạo một dự án mới (Đặt tên bất kỳ, ví dụ: <code>secretletter</code>).</li>
                <li>Vào mục <strong>Build &gt; Realtime Database</strong> &gt; Nhấn <strong>Create Database</strong>.</li>
                <li>Ở bước Security Rules, chọn <strong>Start in test mode</strong> (Cho phép đọc ghi dữ liệu).</li>
                <li>Sao chép đường dẫn URL hiển thị ở đầu bảng (có đuôi <code>firebaseio.com</code>) và dán vào ô bên trên!</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
