import 'dotenv/config';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..', '..');
const distDir = path.join(projectDir, 'dist');

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

async function deployGhPages() {
  const repoUrl = process.env.GITHUB_REPO_URL || process.argv[2];
  const token = process.env.GITHUB_TOKEN || process.argv[3];

  if (!repoUrl || !token) {
    console.error('❌ Thiếu cấu hình GITHUB_REPO_URL hoặc GITHUB_TOKEN trong .env');
    process.exit(1);
  }

  console.log('--- BẮT ĐẦU TRIỂN KHAI LÊN GITHUB PAGES ---');
  console.log(`Kho lưu trữ: ${repoUrl}`);

  // 1. Build mã nguồn frontend với đường dẫn base /secretletter/
  console.log('1. Đang build gói phân phối tĩnh (dist)...');
  process.env.GITHUB_PAGES = 'true';
  process.env.VITE_BASE_PATH = '/secretletter/';
  execSync('npm.cmd run build', {
    cwd: projectDir,
    stdio: 'inherit',
    env: { ...process.env, GITHUB_PAGES: 'true', VITE_BASE_PATH: '/secretletter/' }
  });

  // 2. Tạo file 404.html, .nojekyll và seed-data.json trong dist
  console.log('2. Tạo file 404.html, .nojekyll và seed-data.json...');
  fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf-8');

  // Đóng gói data hiện có làm seed-data.json để các thiết bị mới tự động nhận
  const dataDir = path.join(projectDir, 'data');
  const seedUsersPath = path.join(dataDir, 'users.json');
  const seedLettersPath = path.join(dataDir, 'letters.json');
  const seedVibePath = path.join(dataDir, 'vibeStore.json');

  const seedPayload = {
    users: fs.existsSync(seedUsersPath) ? JSON.parse(fs.readFileSync(seedUsersPath, 'utf-8') || '[]') : [],
    letters: fs.existsSync(seedLettersPath) ? JSON.parse(fs.readFileSync(seedLettersPath, 'utf-8') || '[]') : [],
    vibe: fs.existsSync(seedVibePath) ? JSON.parse(fs.readFileSync(seedVibePath, 'utf-8') || '{}') : {}
  };
  fs.writeFileSync(path.join(distDir, 'seed-data.json'), JSON.stringify(seedPayload, null, 2), 'utf-8');

  // 3. Khởi tạo kho git tạm trong thư mục dist để đẩy lên nhánh gh-pages
  console.log('3. Đóng gói nhánh gh-pages...');
  const distGitDir = path.join(distDir, '.git');
  if (fs.existsSync(distGitDir)) {
    fs.rmSync(distGitDir, { recursive: true, force: true });
  }

  await git.init({ fs, dir: distDir, defaultBranch: 'gh-pages' });

  // Đọc tất cả file trong dist và stage
  function getFiles(dir, files = []) {
    for (const item of fs.readdirSync(dir)) {
      if (item === '.git') continue;
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        getFiles(full, files);
      } else {
        files.push(path.relative(distDir, full).replace(/\\/g, '/'));
      }
    }
    return files;
  }

  const distFiles = getFiles(distDir);
  for (const f of distFiles) {
    await git.add({ fs, dir: distDir, filepath: f });
  }

  const sha = await git.commit({
    fs,
    dir: distDir,
    message: `Deploy to GitHub Pages: ${new Date().toLocaleString('vi-VN')}`,
    author: {
      name: 'Tiến Đạt',
      email: 'tiendat@example.com'
    }
  });

  console.log(`✓ Đã tạo commit gh-pages: ${sha.slice(0, 7)}`);

  // 4. Thêm remote và push lên branch gh-pages
  console.log('4. Đang đẩy gói web lên nhánh gh-pages trên GitHub...');
  await git.addRemote({
    fs,
    dir: distDir,
    remote: 'origin',
    url: repoUrl,
    force: true
  });

  const result = await git.push({
    fs,
    http: customHttp,
    dir: distDir,
    remote: 'origin',
    ref: 'gh-pages',
    force: true,
    onAuth: () => ({ username: token, password: '' })
  });

  console.log('🎉 TRIỂN KHAI LÊN GITHUB PAGES THÀNH CÔNG RỰC RỠ!', result);
  console.log('\n👉 Trang web của bạn sẽ sớm xuất hiện tại:');
  console.log('   https://datmoitapdev.github.io/secretletter/');
}

deployGhPages().catch((err) => {
  console.error('❌ Lỗi khi deploy lên GitHub Pages:', err.message || err);
  process.exit(1);
});
