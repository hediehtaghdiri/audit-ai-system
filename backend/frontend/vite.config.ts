// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
//
// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   optimizeDeps: {
//     exclude: ['lucide-react'],
//   },
// });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'], // تنظیمات قبلی شما
  },
  server: { // بخش جدید اضافه شده
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // آدرس سرور Django
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false, // برای توسعه با HTTPS غیرفعال
      },
    },
  },

  build:{
    rollupOptions: {
      output: {},
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  
});