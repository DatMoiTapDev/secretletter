/**
 * Tiện ích tạo đường dẫn URL chuẩn xác cho toàn hệ thống
 * Tự động nhận diện Base URL (cả trên môi trường phát triển cục bộ và GitHub Pages tĩnh)
 */

export function getAppUrl(subPath = '') {
  if (typeof window === 'undefined') return subPath;
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const cleanSub = subPath.startsWith('/') ? subPath.slice(1) : subPath;
  return `${window.location.origin}${cleanBase}${cleanSub}`;
}

export async function copyToClipboard(text) {
  if (typeof window === 'undefined') return false;
  try {
    if (navigator?.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Navigator clipboard error, trying fallback', err);
  }

  // Fallback cho trình duyệt di động hoặc HTTP
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch (err) {
    console.error('Copy fallback failed', err);
    return false;
  }
}

