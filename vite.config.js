import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Tự động gán base path /secretletter/ khi build trên GitHub Actions để chạy mượt trên GitHub Pages
  base: process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS || process.env.GITHUB_PAGES ? '/secretletter/' : '/'),
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
