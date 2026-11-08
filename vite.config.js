import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  assetsInclude: ['**/couple', 'couple', '**/sad/*', 'sad/*'],
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    host: true
  }
});
