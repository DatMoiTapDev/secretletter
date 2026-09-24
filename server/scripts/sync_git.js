import 'dotenv/config';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..', '..');

const customHttp = {
  request(req) {
    return http.request({
      ...req,
      fetchOptions: {
        ...req.fetchOptions,
        timeout: 600000 // 10 phút
      }
    });
  }
};

async function syncGit() {
  const repoUrl = process.env.GITHUB_REPO_URL || process.argv[2];
  const token = process.env.GITHUB_TOKEN || process.argv[3];
  const commitMsg = process.argv[4] || `Update: ${new Date().toLocaleString('vi-VN')}`;

  if (!repoUrl || !token) {
    console.error('❌ Thiếu cấu hình GitHub trong .env!');
    process.exit(1);
  }

  console.log('--- ĐỒNG BỘ MÃ NGUỒN LÊN GITHUB TỰ ĐỘNG ---');
  console.log(`Kho lưu trữ: ${repoUrl}`);

  // 1. Quét trạng thái tệp tin và stage đầy đủ (thêm, sửa, xóa)
  const matrix = await git.statusMatrix({
    fs,
    dir: projectDir,
    filter: (f) => !f.startsWith('node_modules') && !f.startsWith('.git')
  });

  let stagedCount = 0;
  for (const [filepath, head, workdir, stage] of matrix) {
    const ignored = await git.isIgnored({ fs, dir: projectDir, filepath });
    if (ignored) continue;

    if (workdir === 0) {
      // Tệp tin bị xóa
      await git.remove({ fs, dir: projectDir, filepath });
      stagedCount++;
    } else if (workdir !== head || workdir !== stage) {
      // Tệp tin thêm mới hoặc đã sửa đổi
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

  // 3. Cấu hình remote origin
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
  console.log('Đang đẩy dữ liệu lên GitHub...');
  const result = await git.push({
    fs,
    http: customHttp,
    dir: projectDir,
    remote: 'origin',
    ref: 'main',
    force: true,
    onAuth: () => ({ username: token, password: '' })
  });

  console.log('🎉 ĐỒNG BỘ LÊN GITHUB THÀNH CÔNG RỰC RỠ!', result);
}

syncGit().catch((err) => {
  console.error('❌ Lỗi khi đồng bộ GitHub:', err.message || err);
  process.exit(1);
});
