import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Đảm bảo thư mục data tồn tại
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Khởi tạo tài khoản ban đầu nếu chưa tồn tại
if (!fs.existsSync(USERS_FILE)) {
  const initialUsers = [
    {
      id: 'usr_tiendat_root',
      username: 'tiendat',
      passwordHash: bcrypt.hashSync('Tiendat@2006', 10),
      initialPassword: 'Tiendat@2006',
      displayName: 'Tiến Đạt',
      avatar: '👑',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf-8');
}

/**
 * Đọc tất cả người dùng
 */
export function getAllUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Lỗi khi đọc users.json:', err);
    return [];
  }
}

/**
 * Lưu danh sách người dùng vào file an toàn
 */
export function saveAllUsers(users) {
  try {
    const tempFile = `${USERS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf-8');
    fs.renameSync(tempFile, USERS_FILE);
    return true;
  } catch (err) {
    console.error('Lỗi khi lưu users.json:', err);
    return false;
  }
}

/**
 * Tìm người dùng theo ID
 */
export function getUserById(id) {
  const users = getAllUsers();
  return users.find((u) => u.id === id);
}

/**
 * Tìm người dùng theo username
 */
export function getUserByUsername(username) {
  if (!username) return null;
  const users = getAllUsers();
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase().trim());
}

/**
 * Tạo tài khoản thành viên mới (do Admin cấp)
 */
export async function createUser({ username, password, displayName, avatar }) {
  const users = getAllUsers();
  const cleanUsername = username.toLowerCase().trim();

  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    throw new Error('Tên tài khoản này đã tồn tại.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    passwordHash,
    initialPassword: password, // Lưu để admin có thể tra cứu và cấp cho thành viên
    displayName: displayName || cleanUsername,
    avatar: avatar || '✉️',
    role: 'member',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  users.unshift(newUser);
  saveAllUsers(users);
  return newUser;
}

/**
 * Cập nhật người dùng (đổi trạng thái, đổi mật khẩu, đổi tên)
 */
export async function updateUser(id, updates) {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const current = users[index];
  const payload = { ...updates };

  if (payload.newPassword && payload.newPassword.trim()) {
    const salt = await bcrypt.genSalt(10);
    payload.passwordHash = await bcrypt.hash(payload.newPassword.trim(), salt);
    payload.initialPassword = payload.newPassword.trim();
    delete payload.newPassword;
  }

  users[index] = {
    ...current,
    ...payload,
    updatedAt: new Date().toISOString()
  };

  saveAllUsers(users);
  return users[index];
}

/**
 * Xóa người dùng
 */
export function deleteUser(id) {
  const users = getAllUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  saveAllUsers(filtered);
  return true;
}

/**
 * Xác thực đăng nhập thành viên (Có cơ chế chống timing attack)
 */
export async function authenticateMember(username, plainPassword) {
  const user = getUserByUsername(username);
  if (!user) {
    // Fake bcrypt so sánh để triệt tiêu thời gian phản hồi khác biệt (Timing Attack)
    await bcrypt.compare(plainPassword, '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGH');
    return { success: false, message: 'Tên tài khoản không tồn tại.' };
  }

  if (user.status === 'locked') {
    return { success: false, message: 'Tài khoản này đã bị tạm khóa. Vui lòng liên hệ Admin.' };
  }

  const match = await bcrypt.compare(plainPassword, user.passwordHash);
  if (!match) {
    return { success: false, message: 'Mật khẩu không chính xác.' };
  }

  const { passwordHash, ...safeUser } = user;
  return { success: true, user: safeUser };
}
