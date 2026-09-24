import git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..', '..');

async function initRepo() {
  console.log('--- KHỞI TẠO GIT VÀ TẠO COMMIT ĐẦU TIÊN ---');
  console.log('Thư mục dự án:', projectDir);

  await git.init({ fs, dir: projectDir, defaultBranch: 'main' });
  console.log('✓ Đã tạo/khởi tạo kho Git (.git) với nhánh chính "main".');

  // Đọc danh sách tất cả các file
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
  console.log(`✓ Quét được ${allFiles.length} tệp tin.`);

  const stagedFiles = [];
  for (const filepath of allFiles) {
    const ignored = await git.isIgnored({ fs, dir: projectDir, filepath });
    if (!ignored) {
      await git.add({ fs, dir: projectDir, filepath });
      stagedFiles.push(filepath);
    }
  }

  console.log(`✓ Đã đưa vào Staging ${stagedFiles.length} tệp tin.`);
  console.log('  (Đã tự động loại trừ an toàn: node_modules, .env, MAT_KHAU_HE_THONG.md theo .gitignore)');

  const sha = await git.commit({
    fs,
    dir: projectDir,
    message: 'Initial commit: Digital Secret Letter Platform (Clean commercial release)',
    author: {
      name: 'Tiến Đạt',
      email: 'tiendat@example.com'
    }
  });

  console.log(`✓ Commit khởi tạo hoàn tất! Commit Hash: ${sha}`);
  console.log('\n--- KHO GIT ĐÃ SẴN SÀNG ĐỂ ĐẨY LÊN GITHUB! ---');
}

initRepo().catch(console.error);
