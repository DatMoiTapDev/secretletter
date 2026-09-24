import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..', '..');

// Nhận tham số từ dòng lệnh: node server/scripts/push_to_github.js <repo_url> <token>
const repoUrl = process.argv[2];
const token = process.argv[3];

async function push() {
  if (!repoUrl) {
    console.log('📌 Cách sử dụng:');
    console.log('  node server/scripts/push_to_github.js <URL_REPO_GITHUB> [TOKEN]');
    console.log('\nVí dụ:');
    console.log('  node server/scripts/push_to_github.js https://github.com/username/digital-secret-letter.git ghp_xxxx');
    return;
  }

  console.log(`Đang kết nối đến kho GitHub: ${repoUrl}...`);

  // Thêm hoặc cập nhật remote origin
  try {
    await git.addRemote({
      fs,
      dir: projectDir,
      remote: 'origin',
      url: repoUrl,
      force: true
    });
    console.log('✓ Đã thiết lập remote origin.');
  } catch (err) {
    console.log('Remote đã tồn tại, tiếp tục...');
  }

  console.log('Đang đẩy nhánh main lên GitHub...');
  const pushResult = await git.push({
    fs,
    http,
    dir: projectDir,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({ username: token || 'git', password: token || '' })
  });

  console.log('🎉 ĐÃ ĐẨY LÊN GITHUB THÀNH CÔNG RỰC RỠ!', pushResult);
}

push().catch((err) => {
  console.error('Lỗi khi đẩy lên GitHub:', err.message || err);
});
