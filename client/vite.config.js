import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Limite de taille par chunk (avertissement si dépassé)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Découpage en chunks : vendor (React), icons, http séparés du code app
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          icons:  ['lucide-react'],
          http:   ['axios'],
        },
        // Noms de fichiers avec hash pour cache long terme (immutable)
        chunkFileNames:  'assets/[name]-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
      },
    },
  },
});
