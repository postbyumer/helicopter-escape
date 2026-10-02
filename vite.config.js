import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base is required so the built index.html works when loaded
// via file:// from Electron's packaged app (no web server involved).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
