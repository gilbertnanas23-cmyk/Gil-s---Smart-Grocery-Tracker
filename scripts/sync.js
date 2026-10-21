import { execSync } from 'child_process';

function run(cmd) {
  console.log(`> ${cmd}`);
  return execSync(cmd, { stdio: 'inherit' });
}

console.log('🚀 Memulai otomatisasi Sinkronisasi & Deploy...');

try {
  // 1. Validasi build
  console.log('🔨 Menguji validasi build produksi...');
  run('node ./node_modules/vite/bin/vite.js build');

  // 2. Git stage all
  console.log('📦 Menambahkan seluruh perubahan ke Git...');
  run('git add .');

  // 3. Cek apakah ada perubahan
  const status = execSync('git status --porcelain').toString().trim();
  if (!status) {
    console.log('✨ Tidak ada perubahan baru. Workspace Anda sudah bersih.');
  } else {
    const customMsg = process.argv.slice(2).join(' ') || `update: auto-sync ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`;
    console.log(`📝 Membuat commit: "${customMsg}"`);
    run(`git commit -m "${customMsg}"`);

    // 4. Push ke GitHub
    console.log('🌐 Mengunggah ke GitHub origin/main...');
    run('git push origin main');
    console.log('✅ Berhasil di-push ke GitHub! Vercel akan otomatis men-deploy versi ini dalam hitungan detik.');
  }
} catch (err) {
  console.error('❌ Terjadi kendala saat deploy:', err.message);
  process.exit(1);
}
