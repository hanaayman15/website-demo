import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8011',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://127.0.0.1:8011',
        changeOrigin: true,
      },
      '/doctor/login': {
        target: 'http://127.0.0.1:8011',
        changeOrigin: true,
      },
      '/doctor/signup': {
        target: 'http://127.0.0.1:8011',
        changeOrigin: true,
      },
    },
  },
})
