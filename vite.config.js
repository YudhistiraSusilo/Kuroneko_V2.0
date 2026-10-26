import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replace this with the exact GitHub repository name when it is created.
export default defineConfig({
  plugins: [react()],
  base: '/kuro-neko-food-ordering/',
});
