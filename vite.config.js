import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/multirotor-build/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
