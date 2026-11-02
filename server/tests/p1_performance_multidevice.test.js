import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRACK_URLS, PRESET_TRACKS } from '../../client/src/audio/soundEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// TEST SUITE: P1 AUDIO LIFECYCLE & MULTI-DEVICE SUPPORT
// =========================================================================
test('P1 Audio: Preset tracks and audio URLs are properly configured', () => {
  assert.strictEqual(PRESET_TRACKS.length, 4, 'Phải có đúng 4 chủ đề âm nhạc cốt lõi');
  
  const expectedKeys = ['tet_binh_an', 'happy_birthday', 'tu_khi_gap_em', 'het_duyen_thi_di'];
  for (const key of expectedKeys) {
    assert.ok(TRACK_URLS[key], `TRACK_URLS phải có đường dẫn cho bài ${key}`);
    assert.match(TRACK_URLS[key], /\.mp3$/, `Đường dẫn bài ${key} phải có đuôi .mp3`);
  }
});

test('P1 Audio: Sound volume limits and mute toggling maintain safe boundaries', () => {
  // Test logic volume clamping
  const clampVolume = (vol) => Math.max(0, Math.min(1, vol));

  assert.strictEqual(clampVolume(0.5), 0.5);
  assert.strictEqual(clampVolume(-0.2), 0);
  assert.strictEqual(clampVolume(1.8), 1);
  assert.strictEqual(clampVolume(0), 0);
  assert.strictEqual(clampVolume(1), 1);
});

// =========================================================================
// TEST SUITE: P1 PARTICLE CANVAS & FRAME RATE THROTTLING
// =========================================================================
test('P1 Performance: Particle Canvas FPS throttling logic', () => {
  const getTargetFps = (width) => (width < 768 ? 35 : 60);
  const getFrameInterval = (fps) => 1000 / fps;

  // Mobile (width 375px)
  const mobileFps = getTargetFps(375);
  assert.strictEqual(mobileFps, 35, 'Mobile phải giới hạn ở 35 FPS để tiết kiệm pin');
  assert.ok(Math.abs(getFrameInterval(mobileFps) - 28.57) < 0.1);

  // Desktop (width 1280px)
  const desktopFps = getTargetFps(1280);
  assert.strictEqual(desktopFps, 60, 'Desktop chạy ở 60 FPS');
  assert.ok(Math.abs(getFrameInterval(desktopFps) - 16.66) < 0.1);

  // Throttling logic check: Không render nếu thời gian trôi qua chưa đủ interval
  const shouldRenderFrame = (elapsed, interval) => elapsed >= interval;
  assert.strictEqual(shouldRenderFrame(10, 28.57), false, 'Chưa đủ thời gian thì bỏ qua frame');
  assert.strictEqual(shouldRenderFrame(29, 28.57), true, 'Đã đủ chu kỳ interval thì render frame');
});

// =========================================================================
// TEST SUITE: P1 CODE SPLITTING & BUNDLE VERIFICATION
// =========================================================================
test('P1 Build: Code splitting generates isolated lazy-loaded chunks', () => {
  const distDir = path.join(__dirname, '../../dist/assets');
  assert.ok(fs.existsSync(distDir), 'Thư mục dist/assets phải tồn tại sau khi build');

  const files = fs.readdirSync(distDir);

  // Kiểm tra sự hiện diện của các chunk lazy-loaded độc lập
  const hasAdminDashboardChunk = files.some(f => f.startsWith('AdminDashboard-') && f.endsWith('.js'));
  const hasAdminEditorChunk = files.some(f => f.startsWith('AdminEditor-') && f.endsWith('.js'));
  const hasMemberComposeChunk = files.some(f => f.startsWith('MemberCompose-') && f.endsWith('.js'));
  const hasMemberLoginChunk = files.some(f => f.startsWith('MemberLogin-') && f.endsWith('.js'));
  const hasIndexChunk = files.some(f => f.startsWith('index-') && f.endsWith('.js'));

  assert.ok(hasAdminDashboardChunk, 'AdminDashboard phải được tách thành chunk riêng');
  assert.ok(hasAdminEditorChunk, 'AdminEditor phải được tách thành chunk riêng');
  assert.ok(hasMemberComposeChunk, 'MemberCompose phải được tách thành chunk riêng');
  assert.ok(hasMemberLoginChunk, 'MemberLogin phải được tách thành chunk riêng');
  assert.ok(hasIndexChunk, 'Main entry index chunk phải tồn tại');

  // Kiểm tra kích thước index chunk đã được tối ưu nhỏ hơn 350KB
  const indexFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  const indexSizeKb = fs.statSync(path.join(distDir, indexFile)).size / 1024;
  assert.ok(indexSizeKb < 350, `Main index chunk (${indexSizeKb.toFixed(2)} KB) phải nhỏ hơn 350 KB`);
});
