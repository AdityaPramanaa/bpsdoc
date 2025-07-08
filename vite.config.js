import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfjs-dist/build/pdf.worker.min.js'],
  },
  server: {
    proxy: {
      '/search.php': 'http://localhost/bps',
      '/login.php': 'http://localhost/bps',
      '/upload.php': 'http://localhost/bps',
      '/delete.php': 'http://localhost/bps',
    }
  }
}); 