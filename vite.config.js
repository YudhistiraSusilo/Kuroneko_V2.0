import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Keep this path in sync with the GitHub repository name used by Pages.
export default defineConfig({
  plugins: [react()],
  base: '/Kuroneko_V2.0/',
});
