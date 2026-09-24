import 'dotenv/config';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..', '..');

async function syncGit() {
  const repoUrl = process.env.GITHUB_REPO_URL || process.argv[2];
  const token = process.env.GITHUB_TOKEN || process.argv[3];
  const commitMsg = process.argv[4] || `Update: ${new Date().toLocaleString('vi-VN')}`;

  if (!repoUrl || !token) {
    console.error('❌ Thiếu cấu hình GitHub!');
    console.log('Vui lòng thêm vào file .env:');
    console.log('  GITHUB_REPO_URL=https://github.com/<username>/<repo>.git');
    console.log('  GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx');
    process.exit(1);
  }

  console.log('--- ĐỒNG BỘ MÃ NGUỒN LÊN GITHUB TỰ ĐỘNG ---');
  console.log(`Kho lưu trữ: ${repoUrl}`);

  // 1. Quét và stage các tệp tin mới/chỉnh sửa
  function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      if (file === '.git' || file === 'node_modules') continue;
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        getAllFiles(fullPath, arrayOfFiles);
      } else {
        const relative = path.relative(projectDir, fullPath).replace(/\\/g, '/');
        arrayOfFiles.push(relative);
      }
    }
    return arrayOfFiles;
  }

  const allFiles = getAllFiles(projectDir);
  let stagedCount = 0;

  for (const filepath of allFiles) {
    const ignored = await git.isIgnored({ fs, dir: projectDir, filepath });
    if (!ignored) {
      await git.add({ fs, dir: projectDir, filepath });
      stagedCount++;
    }
  }

  console.log(`✓ Đã kiểm tra và stage ${stagedCount} tệp tin.`);

  // 2. Tạo commit mới
  let sha;
  try {
    sha = await git.commit({
      fs,
      dir: projectDir,
      message: commitMsg,
      author: {
        name: 'Tiến Đạt',
        email: 'tiendat@example.com'
      }
    });
    console.log(`✓ Đã tạo commit mới: ${sha.slice(0, 7)} - "${commitMsg}"`);
  } catch (err) {
    console.log('ℹ️ Không có thay đổi mới cần commit, chuẩn bị push...');
  }

  // 3. Cấu hình remote
  try {
    await git.addRemote({
      fs,
      dir: projectDir,
      remote: 'origin',
      url: repoUrl,
      force: true
    });
  } catch (e) {
    // Remote đã tồn tại
  }

  // 4. Push lên GitHub
  console.log('Đang đẩy lên nhánh main của GitHub...');
  await git.push({
    fs,
    http,
    dir: projectDir,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({ username: token, password: token })
  });

  console.log('🎉 ĐỒNG BỘ LÊN GITHUB THÀNH CÔNG RỰC RỠ!');
}

syncGit().catch((err) => {
  console.error('❌ Lỗi khi đồng bộ GitHub:', err.message || err);
  process.exit(1);
});
