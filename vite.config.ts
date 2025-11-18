import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Must match the GitHub repo name for project pages
  base: '/free-cv-builder/',
});

