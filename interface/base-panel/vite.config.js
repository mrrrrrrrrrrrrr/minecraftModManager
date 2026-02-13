import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5174,
    open: true,
    proxy: {
      // Проксируем все запросы к API на ASP.NET бэкенд
      '/api': {
        target: 'http://localhost:5126',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // Или напрямую к конкретным эндпоинтам
      '/auth': {
        target: 'http://localhost:5126',
        changeOrigin: true
      },
      '/mods': {
        target: 'http://localhost:5126',
        changeOrigin: true
      },
      '/versions': {
        target: 'http://localhost:5126',
        changeOrigin: true
      },
      '/modLoaders': {
        target: 'http://localhost:5126',
        changeOrigin: true
      },
      '/tags': {
        target: 'http://localhost:5126',
        changeOrigin: true
      },
      '/developers': {
        target: 'http://localhost:5126',
        changeOrigin: true
      }
    }
  }
})