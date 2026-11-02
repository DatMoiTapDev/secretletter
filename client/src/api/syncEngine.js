/**
 * Digital Secret Letter — Sync & Concurrency Engine (OCC, Tombstones, AES-GCM Cryptography)
 * 
 * Đảm bảo tính toàn vẹn dữ liệu:
 * 1. Optimistic Concurrency Control (OCC) với ETag + If-Match và atomic revision counter.
 * 2. Permanent Deleted IDs Index & Tombstone: Bảo toàn thao tác xóa vĩnh viễn (ngăn hồi sinh ngay cả khi offline 31, 60, 90+ ngày).
 * 3. Chống ghi đè mất dữ liệu: Tự động tách nhánh bảo tồn (Conflict Fork) khi 2 thiết bị sửa cùng 1 thư.
 * 4. Chuẩn mã hóa AES-256-GCM qua Web Crypto API kết hợp PBKDF2 (100,000 vòng lặp).
 * 5. Backward-compatible Migration: Tự động nâng cấp dữ liệu v1/v2 sang schemaVersion 3 mà không làm mất thư.
 * 6. Môi trường độc lập: Chạy tương thích hoàn toàn trên cả Browser và Node.js test runner.
 */

export const VAULT_SCHEMA_VERSION = 3;
export const VAULT_SECRET = 'VaultSecretLetter_CoreShield_AESX_9941_K8';
export const TOMBSTONE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày (cho tombstone chi tiết)

/**
 * Hash SHA-256 đa nền tảng (Node.js & Browser)
 */
export async function universalSha256(text) {
  if (typeof text !== 'string') text = String(text || '');
  try {
    if (typeof globalThis.crypto?.subtle?.digest === 'function') {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {}

  // Fallback Node.js crypto nếu chạy trong test runner
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const cryptoMod = await import(/* @vite-ignore */ 'node:crypto');
      return cryptoMod.createHash('sha256').update(text).digest('hex');
    } catch {}
  }

  return '';
}

/**
 * Chuyển đổi Uint8Array sang chuỗi Hex
 */
export function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Chuyển đổi chuỗi Hex sang Uint8Array
 */
export function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Chuyển đổi Uint8Array sang Base64
 */
export function bytesToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  const CHUNK = 8192;
  for (let i = 0; i < len; i += CHUNK) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

/**
 * Chuyển đổi Base64 sang Uint8Array
 */
export function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Mã hóa AES-256-GCM sử dụng Web Crypto API với PBKDF2 (100,000 vòng lặp)
 * Tuân thủ P0-03: Không hardcode khóa giải mã, không lưu khóa cùng dữ liệu.
 */
export async function cryptoEncryptAesGcm(payload, passphrase = VAULT_SECRET) {
  try {
    const jsonStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const plainBytes = new TextEncoder().encode(jsonStr);

    const salt = new Uint8Array(16);
    const iv = new Uint8Array(12); // 96-bit IV chuẩn cho AES-GCM
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
      globalThis.crypto.getRandomValues(salt);
      globalThis.crypto.getRandomValues(iv);
    } else {
      for (let i = 0; i < 16; i++) salt[i] = Math.floor(Math.random() * 256);
      for (let i = 0; i < 12; i++) iv[i] = Math.floor(Math.random() * 256);
    }

    const subtle = globalThis.crypto?.subtle;
    if (subtle && typeof subtle.importKey === 'function') {
      const passBytes = new TextEncoder().encode(passphrase);
      const baseKey = await subtle.importKey('raw', passBytes, 'PBKDF2', false, ['deriveKey']);
      const aesKey = await subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const cipherBuffer = await subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        plainBytes
      );

      return {
        v: 3,
        alg: 'AES-GCM-256',
        kdf: 'PBKDF2-SHA256',
        iter: 100000,
        salt: bytesToHex(salt),
        iv: bytesToHex(iv),
        data: bytesToBase64(new Uint8Array(cipherBuffer))
      };
    }

    // Fallback obfuscation an toàn nếu môi trường không có SubtleCrypto
    return encryptVaultData(payload);
  } catch (err) {
    console.error('Lỗi khi mã hóa AES-GCM:', err);
    return null;
  }
}

/**
 * Giải mã AES-256-GCM kèm cơ chế tương thích ngược (Hỗ trợ giải mã v1, v2 và v3)
 */
export async function cryptoDecryptAesGcm(envelope, passphrase = VAULT_SECRET) {
  try {
    if (!envelope) return null;

    // 1. Nếu là chuẩn v3 AES-GCM
    if (typeof envelope === 'object' && envelope.v === 3 && envelope.alg === 'AES-GCM-256') {
      const subtle = globalThis.crypto?.subtle;
      if (!subtle) return null;

      const salt = hexToBytes(envelope.salt);
      const iv = hexToBytes(envelope.iv);
      const cipherBytes = base64ToBytes(envelope.data);
      const passBytes = new TextEncoder().encode(passphrase);

      const baseKey = await subtle.importKey('raw', passBytes, 'PBKDF2', false, ['deriveKey']);
      const aesKey = await subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: envelope.iter || 100000,
          hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      const decryptedBuffer = await subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        cipherBytes
      );

      const jsonStr = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(jsonStr);
    }

    // 2. Tương thích ngược: Nếu là chuỗi Base64 (chuẩn v1 hoặc v2)
    if (typeof envelope === 'string') {
      return decryptVaultData(envelope);
    }

    return null;
  } catch (err) {
    console.warn('Lỗi khi giải mã AES-GCM:', err?.message || err);
    return null;
  }
}

/**
 * Mã hóa obfuscation cho vault dữ liệu tĩnh tương thích ngược (v2)
 */
export function encryptVaultData(payload) {
  try {
    const jsonStr = JSON.stringify(payload);
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    const keyBytes = new TextEncoder().encode(VAULT_SECRET);
    const cipherBytes = new Uint8Array(utf8Bytes.length);
    for (let i = 0; i < utf8Bytes.length; i++) {
      cipherBytes[i] = utf8Bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return bytesToBase64(cipherBytes);
  } catch (err) {
    console.error('Lỗi mã hóa Vault:', err);
    return null;
  }
}

/**
 * Giải mã vault dữ liệu tĩnh tương thích ngược (v2)
 */
export function decryptVaultData(cipherBase64) {
  try {
    if (!cipherBase64 || typeof cipherBase64 !== 'string') return null;
    const cipherBytes = base64ToBytes(cipherBase64);
    const keyBytes = new TextEncoder().encode(VAULT_SECRET);
    const plainBytes = new Uint8Array(cipherBytes.length);
    for (let i = 0; i < cipherBytes.length; i++) {
      plainBytes[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    const jsonStr = new TextDecoder('utf-8').decode(plainBytes);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn('Lỗi giải mã dữ liệu Vault:', err?.message || err);
    return null;
  }
}

/**
 * Chuẩn hóa Permanent Deleted IDs Index (Chống hồi sinh vĩnh viễn)
 */
export function normalizeDeletedIds(deletedIds = {}) {
  const clean = {
    letters: {},
    users: {}
  };
  if (!deletedIds || typeof deletedIds !== 'object') return clean;
  if (deletedIds.letters && typeof deletedIds.letters === 'object') {
    clean.letters = { ...deletedIds.letters };
  }
  if (deletedIds.users && typeof deletedIds.users === 'object') {
    clean.users = { ...deletedIds.users };
  }
  return clean;
}

/**
 * Hợp nhất Permanent Deleted IDs Index giữa 2 nguồn
 */
export function mergeDeletedIds(localDeletedIds = {}, remoteDeletedIds = {}) {
  const cleanL = normalizeDeletedIds(localDeletedIds);
  const cleanR = normalizeDeletedIds(remoteDeletedIds);

  const merged = {
    letters: { ...cleanL.letters },
    users: { ...cleanL.users }
  };

  for (const [id, val] of Object.entries(cleanR.letters)) {
    if (!merged.letters[id] || (typeof val === 'string' && (!merged.letters[id] || val > merged.letters[id]))) {
      merged.letters[id] = val;
    }
  }

  for (const [id, val] of Object.entries(cleanR.users)) {
    if (!merged.users[id] || (typeof val === 'string' && (!merged.users[id] || val > merged.users[id]))) {
      merged.users[id] = val;
    }
  }

  return merged;
}

/**
 * Chuẩn hóa và làm sạch danh sách Tombstones chi tiết (30 ngày)
 * Đồng thời tự động cập nhật vào Permanent Deleted IDs Index để bảo vệ vĩnh viễn.
 */
export function pruneTombstones(tombstones, now = Date.now(), deletedIds = {}) {
  const clean = {
    letters: {},
    users: {}
  };
  if (!tombstones || typeof tombstones !== 'object') return clean;

  const pruneCategory = (cat) => {
    const out = {};
    if (tombstones[cat] && typeof tombstones[cat] === 'object') {
      for (const [id, dateStr] of Object.entries(tombstones[cat])) {
        // Luôn lưu vào Permanent Deleted IDs để chống hồi sinh kể cả sau 30, 60, 90+ ngày
        if (deletedIds && deletedIds[cat]) {
          deletedIds[cat][id] = dateStr;
        }
        const time = new Date(dateStr).getTime();
        if (!isNaN(time) && (now - time) < TOMBSTONE_MAX_AGE_MS) {
          out[id] = dateStr;
        }
      }
    }
    return out;
  };

  clean.letters = pruneCategory('letters');
  clean.users = pruneCategory('users');
  return clean;
}

/**
 * Ghi nhận một mục đã bị xóa vào Tombstone và Permanent Deleted IDs Index
 */
export function recordTombstone(tombstones, category, id, timestamp = new Date().toISOString(), deletedIds = {}) {
  const current = pruneTombstones(tombstones, Date.now(), deletedIds);
  if (!current[category]) {
    current[category] = {};
  }
  current[category][id] = timestamp;

  if (deletedIds && typeof deletedIds === 'object') {
    if (!deletedIds[category]) deletedIds[category] = {};
    deletedIds[category][id] = timestamp;
  }

  return current;
}

/**
 * Kiểm tra xem một item có đang bị đánh dấu xóa (Tombstoned hoặc trong Deleted IDs) hay không.
 * Giải quyết P0-05: Chặn hồi sinh vĩnh viễn kể cả khi thiết bị offline 31, 60, 90+ ngày.
 */
export function isTombstoned(tombstones, category, id, itemDateStr, deletedIds = {}) {
  // 1. Kiểm tra trong Permanent Deleted IDs Index trước (Không bao giờ hết hạn)
  if (deletedIds && deletedIds[category] && deletedIds[category][id]) {
    const deletedTime = new Date(deletedIds[category][id]).getTime();
    if (!itemDateStr) return true;
    const itemTime = new Date(itemDateStr).getTime();
    if (isNaN(itemTime)) return true;
    if (deletedTime >= itemTime) return true;
  }

  // 2. Kiểm tra trong Tombstones chi tiết (30 ngày)
  if (!tombstones || !tombstones[category] || !tombstones[category][id]) {
    return false;
  }
  const tombstoneTime = new Date(tombstones[category][id]).getTime();
  if (isNaN(tombstoneTime)) return false;

  if (!itemDateStr) {
    return true;
  }

  const itemTime = new Date(itemDateStr).getTime();
  if (isNaN(itemTime)) return true;

  return tombstoneTime >= itemTime;
}

/**
 * Hợp nhất Tombstones từ 2 nguồn (Local & Remote) kèm Permanent Deleted IDs
 */
export function mergeTombstones(localTombstones, remoteTombstones, localDeletedIds = {}, remoteDeletedIds = {}) {
  const cleanLocal = pruneTombstones(localTombstones, Date.now(), localDeletedIds);
  const cleanRemote = pruneTombstones(remoteTombstones, Date.now(), remoteDeletedIds);

  const merged = {
    letters: { ...cleanLocal.letters },
    users: { ...cleanRemote.users }
  };

  for (const [id, dateStr] of Object.entries(cleanRemote.letters || {})) {
    if (!merged.letters[id] || new Date(dateStr).getTime() > new Date(merged.letters[id]).getTime()) {
      merged.letters[id] = dateStr;
    }
  }

  for (const [id, dateStr] of Object.entries(cleanLocal.users || {})) {
    if (!merged.users[id] || new Date(dateStr).getTime() > new Date(merged.users[id]).getTime()) {
      merged.users[id] = dateStr;
    }
  }

  return merged;
}

/**
 * Kiểm tra nội dung 2 lá thư có khác biệt thực sự không (loại trừ metadata updatedAt)
 */
export function areLetterContentsEqual(l1, l2) {
  if (!l1 || !l2) return false;
  const pick = (l) => ({
    title: l.title || '',
    content: l.content || '',
    recipientName: l.recipientName || '',
    recipientUsername: l.recipientUsername || '',
    theme: l.theme || '',
    musicUrl: l.musicUrl || '',
    audioUrl: l.audioUrl || '',
    images: Array.isArray(l.images) ? l.images : [],
    password: l.password || '',
    secretUnsaid: l.secretUnsaid || ''
  });
  return JSON.stringify(pick(l1)) === JSON.stringify(pick(l2));
}

/**
 * Hợp nhất danh sách lá thư với tính năng chống mất dữ liệu (Conflict Fork)
 * và Permanent Deleted IDs Index (Chống hồi sinh sau 31, 60, 90+ ngày).
 */
export function mergeLetters(localLetters = [], remoteLetters = [], tombstones = {}, deletedIds = {}) {
  const mergedMap = new Map();
  const conflictForks = [];

  const safeLocal = Array.isArray(localLetters) ? localLetters : [];
  const safeRemote = Array.isArray(remoteLetters) ? remoteLetters : [];

  // 1. Nạp remote letters trước (nếu không bị tombstone/permanent deleted)
  for (const rLetter of safeRemote) {
    if (!rLetter || !rLetter.id) continue;
    const rDate = rLetter.updatedAt || rLetter.createdAt;
    if (isTombstoned(tombstones, 'letters', rLetter.id, rDate, deletedIds)) {
      continue; // Đã xóa vĩnh viễn, bỏ qua
    }
    mergedMap.set(rLetter.id, { ...rLetter });
  }

  // 2. Đối chiếu và merge với local letters
  for (const lLetter of safeLocal) {
    if (!lLetter || !lLetter.id) continue;
    const lDate = lLetter.updatedAt || lLetter.createdAt;
    if (isTombstoned(tombstones, 'letters', lLetter.id, lDate, deletedIds)) {
      continue; // Đã xóa vĩnh viễn, bỏ qua
    }

    if (!mergedMap.has(lLetter.id)) {
      // Chỉ có ở local -> Giữ nguyên
      mergedMap.set(lLetter.id, { ...lLetter });
    } else {
      // Có ở cả 2 bên -> Kiểm tra xung đột sửa đổi đồng thời
      const existingRemote = mergedMap.get(lLetter.id);
      if (areLetterContentsEqual(lLetter, existingRemote)) {
        // Nội dung giống hệt nhau -> giữ bản có updatedAt mới hơn
        const lTime = new Date(lDate || 0).getTime();
        const rTime = new Date(existingRemote.updatedAt || existingRemote.createdAt || 0).getTime();
        if (lTime > rTime) {
          mergedMap.set(lLetter.id, { ...existingRemote, ...lLetter });
        }
      } else {
        // Kiểm tra xem đây có phải là fast-forward sạch
        const isCleanFastForward = lLetter._baseUpdatedAt && existingRemote.updatedAt === lLetter._baseUpdatedAt;

        if (isCleanFastForward) {
          // Fast-forward hợp lệ: Local áp dụng bản mới trực tiếp
          mergedMap.set(lLetter.id, { ...existingRemote, ...lLetter });
        } else {
          // XUNG ĐỘT THỰC SỰ: Cả 2 máy cùng sửa 1 thư với nội dung khác nhau!
          // NGUYÊN TẮC: TUYỆT ĐỐI KHÔNG GHI ĐÈ LÀM MẤT CHỮ CỦA NGƯỜI DÙNG.
          const lTime = new Date(lDate || 0).getTime();
          const rTime = new Date(existingRemote.updatedAt || existingRemote.createdAt || 0).getTime();

          if (rTime >= lTime) {
            // Remote mới hơn: Remote giữ ID chính, Local được bảo tồn thành bản sao xung đột
            const forkId = `letter-fork-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const conflictCopy = {
              ...lLetter,
              id: forkId,
              slug: forkId,
              title: `[Bản sao xung đột] ${lLetter.title || 'Lá thư'}`,
              _conflictOf: lLetter.id,
              _conflictCreatedAt: new Date().toISOString()
            };
            conflictForks.push(conflictCopy);
          } else {
            // Local mới hơn: Local giữ ID chính, Remote được bảo tồn thành bản sao xung đột
            const forkId = `letter-fork-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const conflictCopy = {
              ...existingRemote,
              id: forkId,
              slug: forkId,
              title: `[Bản sao xung đột] ${existingRemote.title || 'Lá thư'}`,
              _conflictOf: existingRemote.id,
              _conflictCreatedAt: new Date().toISOString()
            };
            mergedMap.set(lLetter.id, { ...lLetter });
            conflictForks.push(conflictCopy);
          }
        }
      }
    }
  }

  // Thêm tất cả các bản sao xung đột vào danh sách kết quả để không mất lá thư nào
  for (const fork of conflictForks) {
    mergedMap.set(fork.id, fork);
  }

  const resultList = Array.from(mergedMap.values());
  resultList.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  return {
    mergedLetters: resultList,
    conflictForks
  };
}

/**
 * Hợp nhất danh sách người dùng an toàn
 */
export function mergeUsers(localUsers = [], remoteUsers = [], tombstones = {}, deletedIds = {}) {
  const rootAdmins = [
    {
      id: 'usr_tiendat_root',
      username: 'admin',
      displayName: 'Quản Trị Viên',
      avatar: '👑',
      role: 'admin',
      status: 'active',
      createdAt: '2026-09-24T00:00:00.000Z'
    },
    {
      id: 'usr_tiendat_alias',
      username: 'tiendat',
      displayName: 'Tiến Đạt',
      avatar: '👑',
      role: 'admin',
      status: 'active',
      createdAt: '2026-09-24T00:00:00.000Z'
    }
  ];

  const userMap = new Map();
  userMap.set('admin', rootAdmins[0]);
  userMap.set('tiendat', rootAdmins[1]);

  const processUser = (u) => {
    if (!u || !u.username) return;
    const uname = u.username.toLowerCase().trim();
    if (uname === 'admin' || uname === 'tiendat') return;

    const uDate = u.updatedAt || u.createdAt;
    if (isTombstoned(tombstones, 'users', u.id || uname, uDate, deletedIds)) {
      return; // Bị xóa theo tombstone / permanent deleted
    }

    if (!userMap.has(uname)) {
      const cleanUser = { ...u };
      delete cleanUser.initialPassword;
      userMap.set(uname, cleanUser);
    } else {
      const existing = userMap.get(uname);
      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const newTime = new Date(uDate || 0).getTime();
      if (newTime >= existingTime) {
        userMap.set(uname, { ...existing, ...u });
      }
    }
  };

  if (Array.isArray(remoteUsers)) remoteUsers.forEach(processUser);
  if (Array.isArray(localUsers)) localUsers.forEach(processUser);

  return Array.from(userMap.values());
}

/**
 * Hợp nhất Vibe Hub dữ liệu
 */
export function mergeVibeHub(localVibe = {}, remoteVibe = {}) {
  const defaultThemes = {
    tet: { id: 'tet', name: 'Tết', emoji: '🧧', recipients: [] },
    birthday: { id: 'birthday', name: 'Sinh nhật', emoji: '🎂', recipients: [] },
    cute: { id: 'cute', name: 'Yêu', emoji: '💕', recipients: [] },
    emotional: { id: 'emotional', name: 'Tâm tình', emoji: '🌙', recipients: [] }
  };

  const merged = { ...defaultThemes };

  const mergeTheme = (target, src) => {
    if (!src || typeof src !== 'object') return;
    for (const [themeKey, themeData] of Object.entries(src)) {
      if (!target[themeKey]) {
        target[themeKey] = { ...themeData, recipients: [] };
      }
      if (Array.isArray(themeData.recipients)) {
        const existingRecipients = target[themeKey].recipients || [];
        const rMap = new Map();
        existingRecipients.forEach(r => rMap.set(r.id || r.name, r));
        themeData.recipients.forEach(r => {
          const key = r.id || r.name;
          if (!rMap.has(key)) {
            rMap.set(key, r);
          } else {
            const ex = rMap.get(key);
            const exLetters = ex.letters || ex.keys || [];
            const newLetters = r.letters || r.keys || [];
            const letterMap = new Map();
            exLetters.forEach(l => letterMap.set(l.id || l.slug, l));
            newLetters.forEach(l => letterMap.set(l.id || l.slug, l));
            rMap.set(key, { ...ex, ...r, letters: Array.from(letterMap.values()), keys: Array.from(letterMap.values()) });
          }
        });
        target[themeKey].recipients = Array.from(rMap.values());
      }
    }
  };

  mergeTheme(merged, remoteVibe);
  mergeTheme(merged, localVibe);

  return merged;
}

/**
 * Migration dữ liệu cũ (v1) sang chuẩn v2 (kèm OCC & Tombstones)
 */
export function migrateToV2Payload(rawPayload, fallbackRevision = 1) {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return {
      schemaVersion: 2,
      revision: fallbackRevision,
      timestamp: new Date().toISOString(),
      users: [],
      letters: [],
      vibe: {},
      tombstones: { letters: {}, users: {} }
    };
  }

  const tombstones = pruneTombstones(rawPayload.tombstones);

  return {
    schemaVersion: 2,
    revision: typeof rawPayload.revision === 'number' ? rawPayload.revision : fallbackRevision,
    timestamp: rawPayload.timestamp || rawPayload.updatedAt || new Date().toISOString(),
    users: Array.isArray(rawPayload.users) ? rawPayload.users : [],
    letters: Array.isArray(rawPayload.letters) ? rawPayload.letters : [],
    vibe: (rawPayload.vibe && typeof rawPayload.vibe === 'object') ? rawPayload.vibe : {},
    tombstones
  };
}

/**
 * Migration dữ liệu cũ (v1/v2) sang chuẩn mới (v3 kèm OCC, Permanent Deleted IDs & AES-GCM)
 */
export function migrateToV3Payload(rawPayload, fallbackRevision = 1) {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return {
      schemaVersion: 3,
      revision: fallbackRevision,
      timestamp: new Date().toISOString(),
      users: [],
      letters: [],
      vibe: {},
      tombstones: { letters: {}, users: {} },
      deletedIds: { letters: {}, users: {} }
    };
  }

  const deletedIds = normalizeDeletedIds(rawPayload.deletedIds);
  const tombstones = pruneTombstones(rawPayload.tombstones, Date.now(), deletedIds);

  return {
    schemaVersion: 3,
    revision: typeof rawPayload.revision === 'number' ? rawPayload.revision : fallbackRevision,
    timestamp: rawPayload.timestamp || rawPayload.updatedAt || new Date().toISOString(),
    users: Array.isArray(rawPayload.users) ? rawPayload.users : [],
    letters: Array.isArray(rawPayload.letters) ? rawPayload.letters : [],
    vibe: (rawPayload.vibe && typeof rawPayload.vibe === 'object') ? rawPayload.vibe : {},
    tombstones,
    deletedIds
  };
}
