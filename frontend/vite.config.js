import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El proxy hace que el frontend (5173) y la API (4000) compartan origen: la cookie de sesión viaja sola.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
