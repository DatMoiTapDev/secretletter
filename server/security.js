/**
 * In-memory sliding-window Rate Limiter & Anti-Brute Force Protection
 * Bảo vệ chống tấn công DDoS, quét tự động và dò mật khẩu (Brute-force)
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000; // Mặc định: 1 phút
    this.max = options.max || 100; // Mặc định: 100 requests/phút
    this.message = options.message || 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau.';
    this.hits = new Map();

    // Dọn dẹp bộ nhớ định kỳ mỗi 5 phút để tránh rò rỉ RAM
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  getClientIp(req) {
    return (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      'unknown-ip'
    );
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, record] of this.hits.entries()) {
      if (now - record.resetTime > this.windowMs) {
        this.hits.delete(ip);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      const ip = this.getClientIp(req);
      const now = Date.now();

      let record = this.hits.get(ip);
      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + this.windowMs };
        this.hits.set(ip, record);
        return next();
      }

      record.count += 1;
      if (record.count > this.max) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message: this.message,
          retryAfterSeconds: retryAfter
        });
      }

      next();
    };
  }
}

/**
 * 1. Giới hạn chung cho toàn bộ API (Chống DDoS/Flooding)
 * Tối đa 120 requests / 1 phút mỗi IP
 */
export const generalApiLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Bạn đang gửi quá nhiều yêu cầu đến hệ thống. Vui lòng chậm lại một chút.'
}).middleware();

/**
 * 2. Giới hạn thử đăng nhập (Chống dò mật khẩu Admin & Member Login)
 * Tối đa 6 lần thử trong 5 phút mỗi IP
 */
export const authRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 6,
  message: 'Bạn đã đăng nhập sai quá nhiều lần. Để bảo mật, vui lòng đợi 5 phút sau để thử lại.'
}).middleware();

/**
 * 3. Giới hạn thử mở khóa lá thư (Chống Brute-force mật khẩu lá thư)
 * Tối đa 10 lần đoán trong 3 phút mỗi IP
 */
export const letterUnlockLimiter = new RateLimiter({
  windowMs: 3 * 60 * 1000,
  max: 10,
  message: 'Bạn đã thử mở thư quá nhiều lần liên tiếp. Vui lòng dừng lại và thử lại sau 3 phút.'
}).middleware();

/**
 * 4. Middleware thêm các tiêu đề bảo mật HTTP (Security Headers)
 */
export function applySecurityHeaders(req, res, next) {
  // Ẩn thông tin nền tảng Express để tránh tin tặc khai thác lỗ hổng
  res.removeHeader('X-Powered-By');
  
  // Chống MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Chống Clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Kích hoạt XSS Auditor trình duyệt
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Kiểm soát Referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}
