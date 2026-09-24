import bcrypt from 'bcryptjs';

const ADMIN_SECRET_KEY = process.env.ADMIN_KEY || 'Tiendat@2006';

/**
 * Hash password with bcrypt
 */
export async function hashPassword(plainPassword) {
  if (!plainPassword || plainPassword.trim() === '') {
    return '';
  }
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword.trim(), salt);
}

/**
 * Verify plain password against hashed password
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  if (!hashedPassword || hashedPassword === '') {
    return true; // Thư không đặt mật khẩu
  }
  if (!plainPassword) {
    return false;
  }
  return bcrypt.compare(plainPassword.trim(), hashedPassword);
}

/**
 * Express middleware for Admin authorization
 */
export function requireAdmin(req, res, next) {
  const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];
  if (authHeader && (authHeader === ADMIN_SECRET_KEY || authHeader === `Bearer ${ADMIN_SECRET_KEY}`)) {
    return next();
  }
  return res.status(401).json({ error: 'Truy cập bị từ chối. Cần quyền Quản trị viên (Creator Studio).' });
}

export { ADMIN_SECRET_KEY };
